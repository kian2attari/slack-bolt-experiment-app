const {App, LogLevel, ExpressReceiver} = require('@slack/bolt');
const express = require('express');
const parseGH = require('parse-github-url');
const {query, mutation, graphql} = require('./graphql');
const blocks = require('./blocks');
const safeAccess = require('./helper-functions/safeAccessUndefinedProperty');

// Create a Bolt Receiver
const expressReceiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Initializes your app with your bot token, signing secret, and receiver
// TODO remove debug setting when ready to prod
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: expressReceiver,
  logLevel: LogLevel.DEBUG,
});

/* -------------------------------------------------------------------------- */
/*                             SECTION Data layer                             */
/* -------------------------------------------------------------------------- */

// Object to map GH usernames to Slack usernames
// TODO: Make this persistent on DB
const gh_slack_username_map = {};

// Temporary hardcoding of channel id
// TODO: Remove this hardcoding
/* The data object for this could be a mapping from '{repo_owner}/{repo_name} -> [Array of channel ID's]
Every time someone subscribes to a owner/repo, add their channel to the array with the key of that owner/repo
When any sort of event concerns that repo, post the message to all channels in the array 
A similar thing can be done to map to map repos to project boards */
// The temp channel ID should be found through the users_triage_team object. Loop through
const temp_channel_id = 'C015FH00GVA';

// Example repo object that would be an element in the subscribed_repo_map
// TODO Remove hardcoding of the init variables. They should be based on subscribed repos.
const gh_variables_init = {
  repo_owner: 'slackapi',
  repo_name: 'dummy-kian-test-repo',
};

// Selection state is stored in the order Repo->Project->Column.
// Internal object to store the current state of selections on App Home
// TODO make the repo_path,repo_id etc properties private or just turn this whole obj into a class
const user_app_home_state_obj = {
  currently_selected_repo: {
    repo_path: '',
    repo_id: '',
    currently_selected_project: {
      project_id: '',
      project_name: '',
      set_project(name, id) {
        try {
          this.project_id = id;
          this.project_name = name;
          this.currently_selected_column.clear_column();
          return true;
        } catch (err) {
          console.error(err);
          return false;
        }
      },
      clear_project() {
        try {
          this.project_id = '';
          this.project_name = '';
          this.currently_selected_column.clear_column();
          return true;
        } catch (err) {
          console.error(err);
          return false;
        }
      },
      currently_selected_column: {
        column_id: '',
        column_name: '',
        set_column(name, id) {
          try {
            this.column_name = name;
            this.column_id = id;
            return true;
          } catch (error) {
            console.error(error);
            return false;
          }
        },
        clear_column() {
          try {
            this.column_id = '';
            this.column_name = '';
            return true;
          } catch (err) {
            console.error(err);
            return false;
          }
        },
      },
    },
    // Object methods for setting a new repo
    set_repo(path, id) {
      try {
        this.repo_path = path;
        this.repo_id = id;
        this.currently_selected_project.clear_project();
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    // Clearing the repo
    clear_repo() {
      try {
        this.repo_path = '';
        this.repo_id = '';
        this.currently_selected_project.clear_project();
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
  },
  get_selected_repo_path() {
    return this.currently_selected_repo.repo_path;
  },
  get_selected_project_name() {
    return this.currently_selected_repo.currently_selected_project.project_name;
  },
  get_selected_column_name() {
    return this.currently_selected_repo.currently_selected_project
      .currently_selected_column.column_name;
  },
};

// const user_app_home_state_obj = {
//   currently_selected_repo: {}
// }
// Object that details the repos a user is subscribed to and their preferred default repo. The default repo is automatically picked on App Home load
// TODO This should be persistent, pull it from the DB.
// TODO Also, possible add default_project and default column to the mix. Maybe then default_repo should be an obj
// REVIEW should change subscriptions to be on a team level?
const user_subscribed_repos_obj = {
  default_repo: '',
  set set_default_repo(repo_path) {
    this.default_repo = repo_path;
    user_app_home_state_obj.currently_selected_repo.repo_path = repo_path;
    user_app_home_state_obj.currently_selected_repo.repo_id = this.subscribed_repo_map.get(
      repo_path
    ).repo_id;
  },
  subscribed_repo_map: new Map(),
};

// Declaring some variables to be passed to the GraphQL APIs
// TODO Remove hardcoding from this
// const variables_getFirstColumnInProject = {
//   project_name: 'Slack dummy-test',
//   ...gh_variables_init,
// };

/* Maps a channel id -> array of users.
The channel ID is that triage team's channel
for discussing and recieving team-wide notifs,
and the array of users are the triage people */
const users_triage_team = {};

// Untriaged label object
// TODO Possible remove the name hardcoding
// const untriaged_label = {
//   name: 'untriaged',
//   column_id: '',
//   label_id: '',
// };

// !SECTION

/* -------------------------------------------------------------------------- */
/*                     SECTION Essential initial API calls                    */
/* -------------------------------------------------------------------------- */
// TODO TOP INITIATE API HERE TO AUTHENTICATE
// Get list of Repo Labels
// graphql
//   .call_gh_graphql(
//     query.getRepoLabelsList,
//     gh_variables_init,
//     gh_variables_init,
//   )
//   .then(response => {
//     repo_label_map = response.repository.labels.nodes;
//     untriaged_label.label_id = repo_label_map.find(
//       label => label.name == untriaged_label.name,
//     ).id;

//     // Create a block that contains a section for each label
//     repo_label_map.forEach(label => {
//       label_block.push({
//         text: {
//           type: 'plain_text',
//           text: label.name,
//         },
//         value: {l_id: label.id},
//       });
//     });
//   });

// TODO: Add cards automatically to Needs Triage when they are labelled with the unlabelled tag
// graphql
//   .call_gh_graphql(
//     query.getFirstColumnInProject,
//     variables_getFirstColumnInProject,
//     gh_variables_init
//   )
//   .then(response => {
//     untriaged_label.column_id = response.repository.projects.nodes[0].columns.nodes[0].id;
//   });

// !SECTION

/* -------------------------------------------------------------------------- */
/*                    SECTION Listening for events/options/actions            */
/* -------------------------------------------------------------------------- */

/* ----------------------- SECTION Listening for events ---------------------- */

/* -------------------------- ANCHOR App Home View events -------------------------- */

// Loads the app home when the app home is opened!
// ANCHOR App home opened
app.event('app_home_opened', async ({event, context, client}) => {
  try {
    console.log('user_subscribed_repos_obj: ', user_subscribed_repos_obj);
    /* If a list of initial projects is provided, that must mean that the user has
    either only subscribed to a single repo, or set a default repo. If there's only
    one project, select that by default */

    const default_repo_path = user_subscribed_repos_obj.default_repo;
    // TODO optimize this
    if (
      user_app_home_state_obj.currently_selected_repo.repo_path === '' &&
      user_subscribed_repos_obj.subscribed_repo_map.size !== 0
    ) {
      if (default_repo_path === '') {
        user_app_home_state_obj.currently_selected_repo.set_repo(
          'All Untriaged',
          'all_untriaged'
        );
      } else {
        user_app_home_state_obj.currently_selected_repo.set_repo(
          user_subscribed_repos_obj.default_repo,
          user_subscribed_repos_obj.subscribed_repo_map.get(default_repo_path).repo_id
        );
      }
    }

    console.log('app_home user_app_home_state_obj', user_app_home_state_obj);
    // TODO make all of the select boxes into external_options, only provide the current state to AppHomeBase
    const home_view = blocks.AppHomeBase(user_app_home_state_obj);
    await client.views.publish({
      /* retrieves your xoxb token from context */
      token: context.botToken,

      /* the user that opened your app's app home */
      user_id: event.user,

      /* the view payload that appears in the app home */
      view: home_view,
    });
  } catch (error) {
    console.error(error);
  }
});

// TODO: Create project cards directly from slack

// TODO: Delete project cards directly from slack

// TODO: Move project cards directly from slack

// TODO: View all the project cards in Needs Triage directly on slack

// !SECTION

/* ------------- SECTION Listening for actions ------------ */

app.action('button_open_map_modal', async ({ack, body, context, client}) => {
  // Here we acknowledge receipt
  await ack();

  const {trigger_id} = body;

  await client.views.open({
    token: context.botToken,
    trigger_id,
    view: blocks.UsernameMapModal,
  });
});

app.action(
  'button_open_set_repo_defaults_modal',
  async ({ack, body, context, client}) => {
    // Here we acknowledge receipt
    await ack();

    // TODO: Check the value of the button, if it specifies a repo then set the repo_path
    const selected_repo = {repo_path: undefined};

    console.log(': ----------');
    console.log('button_open_map_modal context', context);
    console.log(': ----------');

    console.log(': ----------');
    console.log('button_open_map_modal context', context);
    console.log(': ----------');

    const {trigger_id} = body;

    await client.views.open({
      token: context.botToken,
      trigger_id,
      view: blocks.SetupRepoNewIssueDefaultsModal(selected_repo),
    });
  }
);

// Responds to the 'See number of cards by column' button on the home page
app.action('column_card_count_info', async ({ack, body, context, client}) => {
  // Here we acknowledge receipt
  await ack();

  const {trigger_id} = body;
  const project_number = parseInt(body.actions[0].value, 10);
  const variables_getCardsByProjColumn = {
    project_number,
    ...gh_variables_init,
  };
  const num_cards_per_column = await graphql.call_gh_graphql(
    query.getNumOfCardsPerColumn,
    variables_getCardsByProjColumn
  );

  const project_name = num_cards_per_column.repository.project.name;

  const array_column_info = num_cards_per_column.repository.project.columns.nodes;

  await client.views.open({
    /* retrieves your xoxb token from context */
    token: context.botToken,

    trigger_id,

    // the view payload that appears in the app home
    view: blocks.AppHomeMoreInfoIssueModal(array_column_info, project_name),
  });
});

app.action('setup_default_modal_repo_selection', async ({ack, body, context, client}) => {
  console.log(': ----------------');
  console.log('setup_default_modal_repo_selection context', context);
  console.log(': ----------------');

  console.log(': ----------');
  console.log('setup_default_modal_repo_selection body', body);
  console.log(': ----------');

  await ack();
  try {
    const action_body = body.actions[0];

    const {selected_option} = action_body;

    const selected_repo_path = selected_option.text.text;

    // const selected_repo_id = selected_option.value;

    console.log('selected_repo_path', selected_repo_path);

    const selected_repo_obj = {
      repo_path: selected_repo_path,
      selected_project_name: undefined,
    };
    const updated_modal = blocks.SetupRepoNewIssueDefaultsModal(selected_repo_obj);

    await client.views.update({
      /* retrieves your xoxb token from context */
      token: context.botToken,

      /* View to be updated */
      view_id: body.view.id,

      /* the view payload that appears in the modal */
      view: updated_modal,
    });
  } catch (error) {
    console.error(error);
  }
});

// app.action(
//   'setup_default_modal_project_selection',
//   async ({ack, body, context, client}) => {
//     console.log(': ----------------');
//     console.log('setup_default_modal_project_selection context', context);
//     console.log(': ----------------');

//     console.log(': ----------');
//     console.log('setup_default_modal_project_selection body', body);
//     console.log(': ----------');

//     await ack();
//     try {
//       const action_body = body.actions[0];

//       const {selected_option} = action_body;

//       const selected_project_name = selected_option.text.text;
//       // TODO remove hardcoding
//       const repo_path = 'slackapi/dummy-kian-test-repo';

//       const selected_repo_obj = {
//         repo_path,
//         selected_project_name,
//       };

//       console.log('selected_repo_obj', selected_repo_obj);

//       const updated_modal = blocks.SetupRepoNewIssueDefaultsModal(selected_repo_obj);

//       await client.views.update({
//         /* retrieves your xoxb token from context */
//         token: context.botToken,

//         /* View to be updated */
//         view_id: body.view.id,

//         /* the view payload that appears in the modal */
//         view: updated_modal,
//       });
//     } catch (error) {
//       console.error(error);
//     }
//   }
// );

// app.action('setup_default_modal_label_list', async ({ack}) => ack());

// app.action('setup_default_modal_column_selection', ({ack}) => ack());

// Acknowledges arbitrary button clicks (ex. open a link in a new tab)
app.action('link_button', async ({ack}) => ack());

/* ------------- ANCHOR Responding to the repo name selection ------------ */

app.action('repo_selection', async ({ack, body, context, client}) => {
  await ack();
  try {
    const action_body = body.actions[0];

    const {selected_option} = action_body;

    const selected_repo_path = selected_option.text.text;

    const selected_repo_id = selected_option.value;

    console.log('selected_repo_path', selected_repo_path);

    console.log('selected_repo_id', selected_repo_id);

    user_app_home_state_obj.currently_selected_repo.set_repo(
      selected_repo_path,
      selected_repo_id
    );

    const updated_home_view = blocks.AppHomeBase(user_app_home_state_obj);
    // QUESTION: should i use views.update or views.publish to update the app home view?
    /* view.publish is the method that your app uses to push a view to the Home tab */
    await client.views.update({
      /* retrieves your xoxb token from context */
      token: context.botToken,

      /* View to be updated */
      view_id: body.view.id,

      /* the view payload that appears in the app home */
      view: updated_home_view,
    });
  } catch (error) {
    console.error(error);
  }
});

/* ------------- ANCHOR Responding to project name selection ------------------- */
app.action('project_selection', async ({ack, body, context, client}) => {
  await ack();

  try {
    const action_body = body.actions[0];

    const {selected_option} = action_body;

    console.log(': --------------------------------');
    console.log('selected_option project_name', selected_option);
    console.log(': --------------------------------');

    const project_name = selected_option.text.text;

    const project_id = selected_option.value;

    user_app_home_state_obj.currently_selected_repo.currently_selected_project.set_project(
      project_name,
      project_id
    );

    console.log(': ------------------------------------------------');
    console.log(
      'user_app_home_state_obj current column',
      user_app_home_state_obj.currently_selected_repo.currently_selected_project
        .currently_selected_column
    );
    console.log(': ------------------------------------------------');

    const home_view = blocks.AppHomeBase(user_app_home_state_obj);
    // console.log(JSON.stringify(home_view.blocks, null, 4));

    /* view.publish is the method that your app uses to push a view to the Home tab */
    await client.views.update({
      /* retrieves your xoxb token from context */
      token: context.botToken,

      /* View to be updated */
      view_id: body.view.id,

      /* the view payload that appears in the app home */
      view: home_view,
    });
  } catch (error) {
    console.error(error);
  }
});

/* ------------- ANCHOR Responding to column selection ------------------- */
// TODO add column select menu to AppHomeBase
app.action('column_selection', async ({ack, body, context, client}) => {
  // TODO account for deleting
  await ack();

  try {
    const action_body = body.actions[0];

    const {selected_option} = action_body;

    const column_name = selected_option.text.text;

    const column_id = selected_option.value;

    const selected_project =
      user_app_home_state_obj.currently_selected_repo.currently_selected_project;

    selected_project.currently_selected_column.set_column(column_name, column_id);
    // TODO Columns must be a map
    // const cards_in_selected_column = user_subscribed_repos_obj.subscribed_repo_map
    //   .get(user_app_home_state_obj.currently_selected_repo.repo_path)
    //   .repo_project_map.get(
    //     user_app_home_state_obj.currently_selected_repo
    //       .currently_selected_project.project_name
    //   ).columns;

    const cards_in_selected_column = user_subscribed_repos_obj.subscribed_repo_map
      .get(user_app_home_state_obj.currently_selected_repo.repo_path)
      .get_cards(selected_project.project_name, column_name);

    console.log('cards_in_selected_column', cards_in_selected_column);

    const card_blocks = blocks.AppHomeIssue(cards_in_selected_column);
    console.log(': ------------------------');
    console.log('card_blocks');
    console.log(': ------------------------');

    const home_view = blocks.AppHomeBase(user_app_home_state_obj, card_blocks);
    // (issue_blocks = blocks.AppHomeIssue(cards_array, label_block)),
    console.log(JSON.stringify(home_view, null, 4));

    /* view.publish is the method that your app uses to push a view to the Home tab */
    await client.views.update({
      /* retrieves your xoxb token from context */
      token: context.botToken,

      /* View to be updated */
      view_id: body.view.id,

      // the view payload that appears in the app home
      view: home_view,
    });
  } catch (error) {
    console.error(error);
  }
});

/* ------------- ANCHOR Responding to label assignment on issue ------------- */

/* ------ TODO - add a clear all labels button ----- */

app.action('label_list', async ({ack, body}) => {
  await ack();
  console.log(': ----------------');
  console.log('body', body);
  console.log(': ----------------');

  try {
    const action_body = body.actions[0];

    console.log('body payload', action_body);

    const {selected_options} = action_body;
    console.log(': ----------------------------------');
    console.log('selected_options', selected_options);
    console.log(': ----------------------------------');

    const {initial_options} = action_body;
    console.log(': --------------------------------');
    console.log('initial_options', initial_options);
    console.log(': --------------------------------');

    const initial_label_names = initial_options.map(option => {
      return option.text.text;
    });

    const selected_label_names = selected_options.map(option => {
      return option.text.text;
    });

    console.log(': --------------------------------');
    console.log('selected_label_names', selected_label_names);
    console.log(': --------------------------------');

    console.log(': --------------------------------');
    console.log('initial_label_names', initial_label_names);
    console.log(': --------------------------------');

    // ES6 doesn't have a set/arrau difference operator, so this just find the symmetric difference between the two
    const label_difference = initial_label_names
      .filter(initial_label => !selected_label_names.includes(initial_label))
      .concat(
        selected_label_names.filter(
          selected_label => !initial_label_names.includes(selected_label)
        )
      );

    // TODO compare the selected_label_ids to the actual label_ids of the card. If they are different, do stuff below
    if (label_difference.length !== 0) {
      /* The card_id is the same for all labels, so we just grab it from the first initial or selected option. One of them has to be there
      otherwise there wouldn't have been a symmetric difference. */
      const card_id =
        safeAccess(() => selected_options[0].value) ||
        safeAccess(() => initial_options[0].value);

      const variables_clearAllLabels = {
        element_node_id: card_id,
      };

      // clear the current labels first
      await graphql.call_gh_graphql(mutation.clearAllLabels, variables_clearAllLabels);

      const repo_labels_map = user_subscribed_repos_obj.subscribed_repo_map.get(
        user_app_home_state_obj.get_selected_repo_path()
      ).repo_label_obj.repo_label_map;

      const selected_label_ids = selected_label_names.map(
        label_name => repo_labels_map.get(label_name).id
      );

      console.log(': --------------------------------');
      console.log('repo_labels_map', repo_labels_map);
      console.log(': --------------------------------');

      console.log(': --------------------------------');
      console.log('selected_label_ids', selected_label_ids);
      console.log(': --------------------------------');

      const variables_addLabelToIssue = {
        label_ids: selected_label_ids,
        ...variables_clearAllLabels,
      };

      if (selected_label_ids.length !== 0) {
        await graphql.call_gh_graphql(mutation.clearAllLabels, variables_clearAllLabels);
        graphql.call_gh_graphql(
          mutation.addLabelToIssue,
          variables_addLabelToIssue,
          gh_variables_init
        );

        // If successful, make sure to pull the new labels/change their state in the object. Tho it's best to rely on the webhooks
      }
    }
  } catch (err) {
    console.error(err);
  }
});

// !SECTION

/* ----------------------- SECTION Listen for options ----------------------- */

// Responding to a repo_selection options with list of repos
app.options('repo_selection', async ({options, ack}) => {
  try {
    // TODO try using options directly
    console.log('repo_selection options', options);

    const subscribed_repos = user_subscribed_repos_obj.subscribed_repo_map;

    console.log('subscribed_repos', subscribed_repos);

    if (subscribed_repos.size !== 0) {
      // const repo_options_block_list = Array.from(subscribed_repos.keys(), repo => {
      //   return option_obj(repo);
      // });
      const repo_options_block_list = [
        option_obj('All Untriaged', 'all_untriaged'),
        ...Array.from(subscribed_repos.keys()).map(repo => {
          return option_obj(repo);
        }),
      ];

      console.log('repo_options_block_list', repo_options_block_list);

      await ack({
        options: repo_options_block_list,
      });
    } else {
      const no_subscribed_repos_option = option_obj(
        'No repo subscriptions found',
        'no_subscribed_repos'
      );
      // REVIEW should I return the empty option or nothing at all?

      await ack({
        options: no_subscribed_repos_option,
      });

      // await ack();
    }
  } catch (error) {
    console.error(error);
  }
});

// Same as the repo_selection option, just has to be seperated for this action_id
app.options('setup_default_modal_repo_selection', async ({options, ack}) => {
  try {
    // TODO try using options directly
    console.log('options', options);

    const subscribed_repos = user_subscribed_repos_obj.subscribed_repo_map;

    console.log('subscribed_repos', subscribed_repos);

    if (subscribed_repos.size !== 0) {
      // const repo_options_block_list = Array.from(subscribed_repos.keys(), repo => {
      //   return option_obj(repo);
      // });
      const repo_options_block_list = Array.from(subscribed_repos.keys()).map(repo => {
        return option_obj(repo);
      });

      console.log('repo_options_block_list', repo_options_block_list);

      await ack({
        options: repo_options_block_list,
      });
    } else {
      const no_subscribed_repos_option = option_obj(
        'No repo subscriptions found',
        'no_subscribed_repos'
      );
      // REVIEW should I return the empty option or nothing at all?

      await ack({
        options: no_subscribed_repos_option,
      });

      // await ack();
    }
  } catch (error) {
    console.error(error);
  }
});

// Responding to a project_selection option with list of projects in a repo
app.options('project_selection', async ({options, ack}) => {
  try {
    // TODO try using options directly
    console.log('options', options);

    const selected_repo_path = user_app_home_state_obj.currently_selected_repo.repo_path;

    const subscribed_repo_projects = user_subscribed_repos_obj.subscribed_repo_map.get(
      selected_repo_path
    ).repo_project_map;

    if (subscribed_repo_projects.size !== 0) {
      const project_options_block_list = Array.from(
        subscribed_repo_projects.values()
      ).map(project => {
        return option_obj(project.name, project.id);
      });

      console.log('project_options_block_list', project_options_block_list);

      await ack({
        options: project_options_block_list,
      });
    } else {
      const no_projects_option = option_obj('No projects found', 'no_projects');
      // REVIEW should I return the empty option or nothing at all?

      await ack({
        options: no_projects_option,
      });

      // await ack();
    }
  } catch (error) {
    console.error(error);
  }
});

// Same as the project_selection modal, just has to have a seperate action ID
app.options('setup_default_modal_project_selection', async ({options, ack}) => {
  try {
    // TODO try using options directly
    console.log('options', options);

    const selected_repo_metadata_obj = JSON.parse(options.view.private_metadata);

    const selected_repo_path = selected_repo_metadata_obj.repo_path;

    const subscribed_repo_projects = user_subscribed_repos_obj.subscribed_repo_map.get(
      selected_repo_path
    ).repo_project_map;

    if (subscribed_repo_projects.size !== 0) {
      const project_options_block_list = Array.from(
        subscribed_repo_projects.values()
      ).map(project => {
        return option_obj(project.name, project.id);
      });

      console.log('project_options_block_list', project_options_block_list);

      await ack({
        options: project_options_block_list,
      });
    } else {
      const no_projects_option = option_obj('No projects found', 'no_projects');
      // REVIEW should I return the empty option or nothing at all?

      await ack({
        options: no_projects_option,
      });

      // await ack();
    }
  } catch (error) {
    console.error(error);
  }
});

// Responding to a column_selection option with list of columns in a repo
app.options('column_selection', async ({options, ack}) => {
  try {
    // TODO try using options directly
    console.log(': ----------------');
    console.log('options', options);
    console.log(': ----------------');

    const selected_repo_path = user_app_home_state_obj.currently_selected_repo.repo_path;

    const selected_project_name =
      user_app_home_state_obj.currently_selected_repo.currently_selected_project
        .project_name;

    console.log(': --------------------------------------------');
    console.log('selected_project_name', selected_project_name);
    console.log(': --------------------------------------------');

    const selected_project_columns = user_subscribed_repos_obj.subscribed_repo_map
      .get(selected_repo_path)
      .repo_project_map.get(selected_project_name).columns;

    if (
      typeof selected_project_columns !== 'undefined' &&
      selected_project_columns.size !== 0
    ) {
      const column_options_block_list = Array.from(selected_project_columns.values()).map(
        column => {
          return option_obj(column.name, column.id);
        }
      );

      console.log('column_options_block_list', column_options_block_list);

      await ack({
        options: column_options_block_list,
      });
    } else {
      const no_columns_option = option_obj('No columns found', 'no_columns');
      console.log('no columns');
      // REVIEW should I return the empty option or nothing at all?

      await ack({
        options: no_columns_option,
      });

      // await ack();
    }
  } catch (error) {
    console.error(error);
  }
});

// Responding to a setup_default_modal_column_selection option with list of columns in a repo
// app.options('setup_default_modal_column_selection', async ({options, ack}) => {
//   try {
//     // TODO try using options directly
//     console.log(': ----------------');
//     console.log('options', options);
//     console.log(': ----------------');

//     const selected_repo_metadata_obj = JSON.parse(options.view.private_metadata);

//     const {repo_path} = selected_repo_metadata_obj;

//     const {selected_project_name} = selected_repo_metadata_obj;

//     console.log(': --------------------------------------------');
//     console.log('selected_repo_metadata_obj', selected_repo_metadata_obj);
//     console.log(': --------------------------------------------');

//     const selected_project_columns = user_subscribed_repos_obj.subscribed_repo_map
//       .get(repo_path)
//       .repo_project_map.get(selected_project_name).columns;

//     if (
//       typeof selected_project_columns !== 'undefined' &&
//       selected_project_columns.size !== 0
//     ) {
//       const column_options_block_list = Array.from(selected_project_columns.values()).map(
//         column => {
//           return option_obj(column.name, column.id);
//         }
//       );

//       console.log('column_options_block_list', column_options_block_list);

//       await ack({
//         options: column_options_block_list,
//       });
//     } else {
//       const no_columns_option = option_obj('No columns found', 'no_columns');
//       console.log('no columns');
//       // REVIEW should I return the empty option or nothing at all?

//       await ack({
//         options: no_columns_option,
//       });

//       // await ack();
//     }
//   } catch (error) {
//     console.error(error);
//   }
// });

app.options('label_list', async ({options, ack}) => {
  try {
    console.log('options', options);
    // TODO if the options value specified a repo_path, then set that as the currently selected_repo_path
    // Get information specific to a team or channel
    const currently_selected_repo_path =
      user_app_home_state_obj.currently_selected_repo.repo_path;

    const currently_selected_repo_map = user_subscribed_repos_obj.subscribed_repo_map.get(
      currently_selected_repo_path
    );

    const options_response = Array.from(
      currently_selected_repo_map.repo_label_obj.repo_label_map.values()
    ).map(label => {
      return {
        'text': {
          'type': 'plain_text',
          'text': label.name,
        },
        'value': label.id,
      };
    });
    await ack({
      'options': options_response,
    });
  } catch (error) {
    console.error(error);
  }
});

// Both label list options do the same thing, they just have to be seperated by action ID
app.options('setup_default_modal_label_list', async ({options, ack}) => {
  try {
    console.log('options', options);

    const selected_repo_metadata_obj = JSON.parse(options.view.private_metadata);
    // TODO if the options value specified a repo_path, then set that as the currently selected_repo_path
    // Get information specific to a team or channel
    const currently_selected_repo_path = selected_repo_metadata_obj.repo_path;

    const currently_selected_repo_map = user_subscribed_repos_obj.subscribed_repo_map.get(
      currently_selected_repo_path
    );

    const options_response = Array.from(
      currently_selected_repo_map.repo_label_obj.repo_label_map.values()
    ).map(label => {
      return {
        'text': {
          'type': 'plain_text',
          'text': label.name,
        },
        'value': label.id,
      };
    });
    await ack({
      'options': options_response,
    });
  } catch (error) {
    console.error(error);
  }
});

// !SECTION

// !SECTION Listening for events/options/actions

/* -------------------------------------------------------------------------- */
/*                       SECTION Listening for shortcuts                       */
/* -------------------------------------------------------------------------- */

app.shortcut('setup_triage_workflow', async ({shortcut, ack, context, client}) => {
  try {
    // Acknowledge shortcut request
    await ack();

    // Call the views.open method using one of the built-in WebClients
    const result = await client.views.open({
      // The token you used to initialize your app is stored in the `context` object
      token: context.botToken,
      trigger_id: shortcut.trigger_id,
      view: blocks.SetupShortcutModalStatic,
    });

    console.log(result);
  } catch (error) {
    console.error(error);
  }
});

app.shortcut('modify_repo_subscriptions', async ({shortcut, ack, context, client}) => {
  try {
    // Acknowledge shortcut request
    await ack();

    // Call the views.open method using one of the built-in WebClients
    const result = await client.views.open({
      // The token you used to initialize your app is stored in the `context` object
      token: context.botToken,
      trigger_id: shortcut.trigger_id,
      view: blocks.ModifyRepoSubscriptionsModal(
        user_subscribed_repos_obj.subscribed_repo_map.keys()
      ),
    });

    console.log(result);
  } catch (error) {
    console.error(error);
  }
});

app.shortcut('modify_github_username', async ({shortcut, ack, context, client}) => {
  try {
    // Acknowledge shortcut request
    await ack();

    const user_id = shortcut.user.id;

    // Call the views.open method using one of the built-in WebClients
    client.chat.postMessage({
      token: context.botToken,
      channel: user_id,
      text: `Hey <@${user_id}>! Click here to change your GitHub username`,
      blocks: blocks.UsernameMapMessage(user_id),
    });
  } catch (error) {
    console.error(error);
  }
});

// !SECTION Listening for shortcuts

/* -------------------------------------------------------------------------- */
/*                   SECTION Listening for view submissions                   */
/* -------------------------------------------------------------------------- */

app.view('setup_triage_workflow_view', async ({ack, body, view, context}) => {
  // Acknowledge the view_submission event
  await ack();

  console.log(view.state.values);

  const selected_users_array =
    view.state.values.users_select_input.triage_users.selected_users;
  const user = body.user.id;

  console.log('selected_users_array', selected_users_array);

  const {selected_channel} = view.state.values.channel_select_input.triage_channel;

  // Message to send user
  let msg = '';

  // Save triage users
  users_triage_team[selected_channel] = selected_users_array;

  if (selected_users_array.length !== 0) {
    // DB save was successful
    msg = 'Team members assigned successfully';
  } else {
    msg = 'There was an error with your submission';
  }

  // Message the user
  try {
    await app.client.chat.postMessage({
      token: context.botToken,
      channel: user,
      text: msg,
    });

    users_triage_team[selected_channel].forEach(user_id => {
      app.client.chat.postMessage({
        token: context.botToken,
        channel: user_id,
        text:
          `Hey <@${user_id}>! ` +
          "You've been added to the triage team. Tell me your GitHub username.",
        blocks: blocks.UsernameMapMessage(user_id),
      });
    });
  } catch (error) {
    console.error(error);
  }
});

app.view('map_username_modal', async ({ack, body, view, context}) => {
  // Acknowledge the view_submission event
  await ack();

  console.log(view.state.values);

  const github_username =
    view.state.values.map_username_block.github_username_input.value;

  console.log('github username', github_username);

  const slack_username = body.user.id;

  console.log('slack_username 1', slack_username);

  if (typeof gh_slack_username_map[github_username] === 'undefined') {
    // We map the github username to that Slack username
    gh_slack_username_map[github_username] = slack_username;

    console.log('gh_slack_username_map', gh_slack_username_map);

    console.log('slack_username', slack_username);

    // Message the user
    try {
      await app.client.chat.postMessage({
        token: context.botToken,
        channel: slack_username,
        text:
          `<@${gh_slack_username_map[github_username]}>, ` +
          'your Slack and Github usernames were associated successfully! Your GitHub username is currently set to' +
          ` ${github_username}. ` +
          "If that doesn't look right, click the enter github username button again.",
      });
    } catch (error) {
      console.error(error);
    }
  }
});

app.view('modify_repo_subscriptions', async ({ack, body, view, context}) => {
  // Acknowledge the view_submission event
  await ack();

  const slack_user_id = body.user.id;

  const view_values = view.state.values;

  const subscribe_repo =
    view_values.subscribe_to_repo_block.subscribe_to_repo_input.value;

  const unsubscribe_block = view_values.unsubscribe_repos_block;

  const current_subscribed_repos = user_subscribed_repos_obj.subscribed_repo_map;

  /* safeAccess() is a try/catch utility function.
  Since the unsubscribe repos input can be left blank */
  // Does the user want to set the repo as their default repo?
  const default_repo_value = safeAccess(
    () =>
      view_values.default_repo_checkbox_block.default_repo_checkbox_input
        .selected_options[0].value
  );

  console.log('default repo bool: ' + default_repo_value);

  const unsubscribe_repo = safeAccess(
    () => unsubscribe_block.unsubscribe_repos_input.selected_option.value
  );

  if (typeof subscribe_repo === 'undefined' && unsubscribe_repo === null) {
    console.error('No repos specified by user');
    return;
  }

  const subscribe_repo_obj =
    // TODO project list
    typeof subscribe_repo !== 'undefined' ? new_repo_obj(subscribe_repo) : null;

  console.log('user_subscribed_repos_obj before', user_subscribed_repos_obj);

  // Logs the input for subscribing to new repo if any
  console.log('subscribe_repo_obj', subscribe_repo_obj);

  // Logs the unsubscribe repos if any are present
  console.log('unsubscribe_repo: ', unsubscribe_repo);

  // ERROR! The user is already subscribed to the repo they want to subscribe to
  if (
    subscribe_repo_obj !== null &&
    current_subscribed_repos.has(subscribe_repo_obj.repo_path)
  ) {
    app.client.chat.postMessage({
      token: context.botToken,
      channel: slack_user_id,
      text: `Whoops <@${slack_user_id}>, you're already subscribed to *${subscribe_repo_obj.repo_path}*`,
    });
    console.error(`User already subscribed to repo ${subscribe_repo_obj.repo_path}`);
  } else if (unsubscribe_repo !== null) {
    // ERROR! The user is trying to subscribe and unsubscribe from the same repo
    if (
      subscribe_repo_obj !== null &&
      typeof current_subscribed_repos.get(subscribe_repo_obj.repo_path) !== 'undefined'
    ) {
      app.client.chat.postMessage({
        token: context.botToken,
        channel: slack_user_id,
        // TODO Check if mentions are setup and change the message based on that
        text:
          `<@${slack_user_id}> Woah there Schrödinger, ` +
          "you can't simultaneously subscribe and unsubscribe from" +
          ` *${unsubscribe_repo}*`,
      });
      console.error(
        // eslint-disable-next-line prefer-template
        'User tried to simultaneously subscribe and unsubscribe to repo ' +
          subscribe_repo_obj.repo_path
      );
      return;
    }
    current_subscribed_repos.delete(unsubscribe_repo);
    if (unsubscribe_repo === user_app_home_state_obj.currently_selected_repo) {
      user_app_home_state_obj.currently_selected_repo = {};
    }
    if (unsubscribe_repo === user_subscribed_repos_obj.default_repo) {
      // if only one repo is left, that should be the default now
      user_subscribed_repos_obj.set_default_repo =
        current_subscribed_repos.size === 1
          ? current_subscribed_repos.values().next().value.repo_path
          : '';

      app.client.chat.postMessage({
        token: context.botToken,
        channel: slack_user_id,
        text:
          `Hey <@${slack_user_id}>!, ` +
          'you are now unsubscribed from' +
          ` *${unsubscribe_repo}*. ` +
          'Since' +
          ` *${unsubscribe_repo}* ` +
          'was your default repo, make sure you pick a new one through the shortcut!',
      });
    } else {
      // Everything is in order, unsubscribe from the specified repo
      app.client.chat.postMessage({
        token: context.botToken,
        channel: slack_user_id,
        // TODO Check if mentions are setup and change the message based on that
        text: `Hey <@${slack_user_id}>!, you are now unsubscribed from *${unsubscribe_repo}*`,
      });
      console.error('User unsubscribed from repo: ' + unsubscribe_repo);
      return;
    }
    console.log('user_subscribed_repos_obj', user_subscribed_repos_obj);
    console.log('user_app_home_state_obj', user_app_home_state_obj);
  }
  // Everything seems to be in order, subscribe to the specified repo
  if (subscribe_repo_obj !== null) {
    try {
      // TODO remove await?
      const repo_data = await get_repo_data(subscribe_repo_obj);
      subscribe_repo_obj.repo_project_map = repo_data.repo_projects;

      subscribe_repo_obj.repo_label_obj.repo_label_map = repo_data.repo_labels;
      // Set the untriaged label_id. Currently hard coded to a label with the name untriaged. This will be fixed so that the label can be named whatever the user wants.
      // TODO remove hardcoding here
      subscribe_repo_obj.repo_label_obj.untriaged_label.label_id = repo_data.repo_labels.get(
        'untriaged'
      ).id;

      // Set the first column of the first project as the column for new issue cards to be created in
      // TODO remove the first column hardcoding and let the user select their preferred default proj and column when subscribing.
      // TODO HIGH Send a message to the user as soon as subscription is complete so they can set up the untriaged label and the untriaged column
      // subscribe_repo_obj.repo_label_obj.untriaged_label.untriaged_column_id = subscribe_repo_obj.repo_project_map.values();
      // very temp hardcoding hehe
      subscribe_repo_obj.repo_label_obj.untriaged_label.untriaged_column_id =
        'MDEzOlByb2plY3RDb2x1bW45NjMyODQ0';

      subscribe_repo_obj.repo_id = repo_data.repo_id;

      const is_default_repo = !!(default_repo_value === 'default_repo');

      current_subscribed_repos.set(subscribe_repo_obj.repo_path, subscribe_repo_obj);

      // Subscribe to the specified repo
      if (is_default_repo) {
        user_subscribed_repos_obj.set_default_repo = subscribe_repo_obj.repo_path;
      }

      console.log('user_app_home_state_obj', user_app_home_state_obj);

      // Success! Message the user
      try {
        await app.client.chat.postMessage({
          token: context.botToken,
          channel: slack_user_id,
          // TODO Check if mentions are setup and change the message based on that
          text: `<@${slack_user_id}>, you've successfully subscribed to *${subscribe_repo_obj.repo_path}*. Make sure you set up the *New Issue defaults* for this repo using the global shortcut so that I can automatically assign newly-created issues to a project and column of your choice as soon as they are created!`,
          blocks: blocks.SetupRepoDefaultsMessage(
            slack_user_id,
            subscribe_repo_obj.repo_path
          ),
        });
      } catch (error) {
        console.error(error);
      }
    } catch (err) {
      console.error(err);
    }
  }
  console.log('user_subscribed_repos_obj', user_subscribed_repos_obj);
  console.log('current_subscribed_repos', current_subscribed_repos);
  console.log('subscribe_repo_obj', subscribe_repo_obj);
});

app.view('repo_new_issue_defaults_modal', async ({ack, body, view, context}) => {
  // Acknowledge the view_submission event
  await ack();

  const slack_user_id = body.user.id;

  const view_values = view.state.values;

  const default_untriaged_issues_label =
    view_values.untriaged_label_block_input.setup_default_modal_label_list
      .selected_option;

  const default_untriaged_issues_project =
    view_values.untriaged_project_block_input.setup_default_modal_project_selection
      .selected_option;

  console.log(': --------------------------------------------------------------');
  console.log('default_untriaged_issues_label', default_untriaged_issues_label);
  console.log(': --------------------------------------------------------------');

  console.log(': ------------------------------------------------------------------');
  console.log('default_untriaged_issues_project', default_untriaged_issues_project);
  console.log(': ------------------------------------------------------------------');

  // Success! Message the user
  try {
    await app.client.chat.postMessage({
      token: context.botToken,
      channel: slack_user_id,
      text: `Hi <@${slack_user_id}>, the default label and project for new/untriaged issues was assigned successfully!`,
    });
  } catch (error) {
    console.error(error);
  }
});
// !SECTION Listening for view submissions
/* -------------------------------------------------------------------------- */
/*                     SECTION Where webhooks are received                    */
/* -------------------------------------------------------------------------- */

// Parsing JSON Middleware
expressReceiver.router.use(express.json());

// Receive github webhooks here!
expressReceiver.router.post('/webhook', (req, res) => {
  if (req.headers['content-type'] !== 'application/json') {
    return res.send('Send webhook as application/json');
  }

  /* -------- TODO organize this to use swtich cases or modular design (array based?) -------- */

  try {
    const request = req.body;
    const {action} = request;

    const repo_path = request.repository.full_name;
    console.log(': --------------------');
    console.log('repo_path', repo_path);
    console.log(': --------------------');

    // TODO: Handle other event types. Currently, it's just issue-related events
    if (req.headers['x-github-event'] === 'issues') {
      const issue_url = request.issue.html_url;
      const issue_title = request.issue.title;
      const issue_body = request.issue.body;
      const issue_creator = request.issue.user.login;
      const creator_avatar_url = request.issue.user.avatar_url;
      const issue_create_date = new Date(request.issue.created_at);
      const issue_node_id = request.issue.node_id;

      const repo_obj = user_subscribed_repos_obj.subscribed_repo_map.get(repo_path);
      console.log(': ------------------');
      console.log('repo_obj', repo_obj);
      console.log(': ------------------');

      // QUESTION: Should editing the issue also cause the untriaged label to be added?
      if (action === 'opened' || action === 'reopened') {
        const untriaged_label_id = repo_obj.repo_label_obj.untriaged_label.label_id;
        const variables_addLabelToIssue = {
          element_node_id: issue_node_id,
          label_ids: [untriaged_label_id],
        };

        graphql.call_gh_graphql(
          mutation.addLabelToIssue,
          variables_addLabelToIssue,
          gh_variables_init
        );
        // TODO: instead of channel id, send over the users_triage_team object or don't and do it in the function
        check_for_mentions(
          temp_channel_id,
          issue_title,
          issue_body,
          issue_url,
          issue_creator,
          creator_avatar_url,
          issue_create_date
        );
      } else if (action === 'labeled') {
        /* ---- ANCHOR What to do  there is a label added or removed from an issue ---- */
        // const issue_label_array = request.issue.labels;

        const label_id = request.label.node_id;
        const {untriaged_label} = repo_obj.repo_label_obj;

        console.log(': ------------------');
        console.log('label_id', label_id);
        console.log(': ------------------');

        console.log(': --------------------------------------------------');
        console.log('untriaged_label id', untriaged_label.label_id);
        console.log(': --------------------------------------------------');

        if (label_id === untriaged_label.label_id) {
          const addCardToColumn_variables = {
            issue: {
              projectColumnId: untriaged_label.untriaged_column_id,
              contentId: issue_node_id,
            },
          };
          graphql.call_gh_graphql(mutation.addCardToColumn, addCardToColumn_variables);
        }
      } else if (action === 'unlabeled') {
        /* -- TODO remove project from new issue column if untriaged label removed -- */
        // const label_id = request.label.node_id
        // console.log(label_id)
        // console.log(untriaged_label.label_id)
        // if (label_id == untriaged_label.label_id) {
        //   const addCardToColumn_variables = {"issue": {"projectColumnId" : untriaged_label.column_id, "contentId": issue_node_id}}
        //   graphql.call_gh_graphql(mutation.addCardToColumn, addCardToColumn_variables)
        // }
      }
    } else if (req.headers['x-github-event'] === 'issue_comment') {
      const issue_url = request.issue.html_url;
      const issue_title = request.issue.title;
      const comment_body = request.comment.body;
      const comment_creator = request.comment.user.login;
      const creator_avatar_url = request.comment.user.avatar_url;
      const comment_create_date = new Date(request.comment.created_at);

      if (req.body.issue.state === 'closed') {
        mention_message(
          temp_channel_id,
          `Comment on closed issue: ${issue_title}`,
          comment_body,
          issue_url,
          comment_creator,
          creator_avatar_url,
          comment_create_date,
          '!channel',
          true
        );
      }

      check_for_mentions(
        temp_channel_id,
        `New comment on issue: ${issue_title}`,
        comment_body,
        issue_url,
        comment_creator,
        creator_avatar_url,
        comment_create_date
      );
    }
  } catch (error) {
    console.error(error);
  }
  res.send('Webhook initial test was received');
});

// !SECTION

/* -------------------------------------------------------------------------- */
/*                          SECTION Where app starts                          */
/* -------------------------------------------------------------------------- */

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();

// !SECTION

/* -------------------------------------------------------------------------- */
/*                        SECTION Function definitions                        */
/* -------------------------------------------------------------------------- */

/* The @ symbol for mentions is not concatenated here because the convention for mentioning is different 
between mentioning users/groups/channels. To mention the channel, say when a closed issue is commented
on, the special convention is <!channel>. */
function githubBlock(
  title,
  body,
  gh_url,
  creator,
  avatar_url,
  date,
  mentioned_slack_user
) {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<${mentioned_slack_user}>*`,
      },
    },

    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${title}*`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      accessory: {
        type: 'image',
        image_url: avatar_url,
        alt_text: `${creator}'s GitHub avatar`,
      },
      text: {
        type: 'plain_text',
        text: body,
        emoji: true,
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Visit issue page',
            emoji: true,
          },
          url: gh_url,
          action_id: 'link_button',
        },
      ],
    },
    {
      type: 'context',
      elements: [
        {
          type: 'plain_text',
          text: `Date: ${date}`,
          emoji: true,
        },
      ],
    },
  ];
}

// TODO: Get user's timezone and display the date/time with respect to it

function mention_message(
  channel_id,
  title,
  body,
  url,
  creator,
  avatar_url,
  create_date,
  mentioned_slack_user,
  is_issue_closed
) {
  app.client.chat.postMessage({
    // Since there is no context we just use the original token
    token: process.env.SLACK_BOT_TOKEN,
    // Conditional on whether the message should go to channel or just to a user as a DM
    ...(is_issue_closed && {
      channel: channel_id,
      blocks: githubBlock(
        title,
        body,
        url,
        creator,
        avatar_url,
        create_date,
        mentioned_slack_user
      ),
    }),

    ...(!is_issue_closed && {
      channel: mentioned_slack_user,
      blocks: githubBlock(
        title,
        body,
        url,
        creator,
        avatar_url,
        create_date,
        `@${mentioned_slack_user}`
      ),
    }),
    text: `<@${mentioned_slack_user}>! ${title} posted by ${creator} on ${create_date}. Link: ${url}`,
  });
}

// TODO: Function that lets user see all the username mappings with a slash command
function view_username_mappings(username_mappings) {
  console.log(username_mappings);
}

// Function that checks for github username mentions in a body of text
function check_for_mentions(
  channel_id,
  title,
  text_body,
  content_url,
  content_creator,
  creator_avatar_url,
  content_create_date
) {
  /* Since the regex contains a global operator, matchAll can used to get all the matches & the groups as an iterable.
  In this first version, we don't need to use substring(1) to drop the @ since contains_mention would also have just the usernames. */

  const contains_mention = text_body.match(/\B@([a-z0-9](?:-?[a-z0-9]){0,38})/gi);

  // Checks to see if the body mentions a username
  if (contains_mention) {
    contains_mention.forEach(mentioned_username => {
      const github_username = mentioned_username.substring(1);

      console.log(`mentioned gh username: ${github_username}`);

      const mentioned_slack_user = gh_slack_username_map[github_username];

      console.log(`mentioned slack user: ${mentioned_slack_user}`);

      // If the mentioned username is associated with a Slack username, mention that person

      if (mentioned_slack_user) {
        mention_message(
          channel_id,
          title,
          text_body,
          content_url,
          content_creator,
          creator_avatar_url,
          content_create_date,
          mentioned_slack_user,
          false
        );
      }
    });
  }
}

// TODO project and labels should be pulled from subscribe_repo
/**
 *
 * Creates a repo object
 * @param {{owner: string, name: string, repo: string}} subscribe_repo
 * @returns {{repo_owner: string, repo_name: string, repo_path: string, repo_label_obj: {untriaged_label: {label_id: string, label_name: string, untriaged_column_id: string}, repo_label_map: Map<string,object>}, repo_project_map: Map<string,object>}} A repo object
 */
function new_repo_obj(subscribe_repo) {
  const parsed_url = parseGH(subscribe_repo);
  // TODO fix the methods
  const repo_obj = {
    repo_owner: parsed_url.owner,
    repo_name: parsed_url.name,
    repo_path: parsed_url.repo,
    // The properties below have to be gotten from an API call
    // TODO builtin method in this object/class to do the API call
    repo_id: '',
    repo_label_obj: {
      untriaged_label: {
        label_id: '',
        label_name: '',
        untriaged_column_id: '',
      },
      repo_label_map: new Map(),
    },
    // Projects are mapped from project_name -> {project_id, project_columns_map:}
    repo_project_map: new Map(),
    // set_projects: project_list => {
    //   this.repo_project_map = new Map(
    //     project_list.map(project => [project.val.name, project.val])
    //   );
    // },
    // get_project_column: (project_name, column_name) => {
    //   return this.get_project(project_name).project_column_map.get(column_name);
    // },
    // set_project_columns: (project_name, column_list) => {
    //   this.get_project(project_name).project_column_map = new Map(
    //     column_list.map(column => [column.val.name, column.val])
    //   );
    // },
    // TODO add method for getting project
    get_cards(project_name, column_name) {
      return this.repo_project_map.get(project_name).columns.get(column_name).cards.nodes;
    },
  };
  return repo_obj;
}

async function get_repo_data(repo_obj) {
  const repo_data_response = await graphql.call_gh_graphql(query.getRepoData, repo_obj);

  console.log(repo_data_response);

  // There was an error!
  // TODO Improve this error
  if (Object.prototype.hasOwnProperty.call(repo_data_response, 'error_type')) {
    throw new Graphql_call_error(
      repo_data_response.error_type,
      repo_data_response.error_list
    );
  }

  const label_nodes_list = repo_data_response.repository.labels.nodes;
  const project_nodes_list = repo_data_response.repository.projects.nodes;
  // Turn the labels into a Map for quick reference + iteration
  const label_map = new Map(
    label_nodes_list.map(label_obj => [label_obj.name, label_obj])
  );
  // REVIEW can this be made more efficient?
  // Turning the GitHub response object to use Maps not nested objects/arrays
  const repo_projects_map = new Map(
    project_nodes_list.map(project => {
      const project_obj = project;
      project_obj.columns = new Map(
        project_obj.columns.nodes.map(column => [column.name, column])
      );
      return [project_obj.name, project_obj];
    })
  );

  const processed_object = {
    repo_id: repo_data_response.repository.id,
    repo_labels: label_map,
    repo_projects: repo_projects_map,
  };

  console.log('processed_object', processed_object);

  return processed_object;
}

function option_obj(option_text, option_val = option_text) {
  return {
    'text': {
      'type': 'plain_text',
      'text': option_text,
      'emoji': true,
    },
    'value': option_val,
  };
}

function Graphql_call_error(error_type, error_list) {
  this.type = error_type;
  this.error_list = error_list;
}

// !SECTION
