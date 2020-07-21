const {App, LogLevel, ExpressReceiver} = require('@slack/bolt');
const express = require('express');
const {query, mutation, graphql} = require('./graphql');
const {AppHome, Messages, Modals, SubBlocks} = require('./blocks');
const {SafeAccess} = require('./helper-functions');
const {
  actions_listener,
  events_listener,
  options_listener,
  views_listener,
  common_functions,
} = require('./listeners');
const {UserAppHomeState, TriageTeamData} = require('./models');

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
// const gh_slack_username_map = {};

// Temporary hardcoding of channel id just to make testing/development easier
// TODO: Remove this hardcoding
const temp_channel_id = 'C015FH00GVA';

// TODO get this from DB
const default_selected_repo = {
  repo_path: 'All Untriaged',
  repo_id: 'all_untriaged',
};

// Selection state is stored in the order Repo->Project->Column.
// Internal object to store the current state of selections on App Home
// TODO possible replace this entirely with the private_metadata property
const user_app_home_state_obj = new UserAppHomeState(default_selected_repo);
console.log(': ----------------------------------------');
console.log('user_app_home_state_obj', user_app_home_state_obj);
console.log(': ----------------------------------------');

/* Data object for persistent triage team data such as team members (and their github usernames), 
the repos the team is subscribed to, and the triage team's channel */

// TODO store this in DB as team_channel_id -> triage_team_data_obj
const triage_team_data_obj = new TriageTeamData();
console.log(': ------------------------------------------');
console.log('triage_team_data_obj', triage_team_data_obj);
console.log(': ------------------------------------------');
// !SECTION

/* -------------------------------------------------------------------------- */
/*                    SECTION Listening for events/options/actions            */
/* -------------------------------------------------------------------------- */

/* ----------------------- SECTION Listening for events ---------------------- */

/* -------------------------- ANCHOR App Home View events -------------------------- */

// Loads the app home when the app home is opened!
// ANCHOR App home opened
events_listener.app_home.app_home_opened(
  app,
  triage_team_data_obj,
  user_app_home_state_obj,
  default_selected_repo
);

// !SECTION

/* ------------- SECTION Listening for actions ------------ */
// Opens the username map modal
actions_listener.buttons.open_map_modal_button(
  app,
  triage_team_data_obj.team_data.team_members
);

// Opens the modal for setting default repos
actions_listener.buttons.open_set_repo_defaults_modal_button(app);

actions_listener.buttons.show_untriaged_filter_button(
  app,
  triage_team_data_obj,
  user_app_home_state_obj
);

app.action('setup_repo_defaults_repo_modal', async ({ack, body, context, client}) => {
  console.log(': ----------------');
  console.log('setup_repo_defaults_repo_modal context', context);
  console.log(': ----------------');

  console.log(': ----------');
  console.log('setup_repo_defaults_repo_modal body', body);
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
    const updated_modal = Modals.SetupRepoNewIssueDefaultsModal(selected_repo_obj);

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

// app.action('setup_default_modal_label_list', async ({ack}) => ack());

// app.action('setup_default_modal_column_selection', ({ack}) => ack());

// Acknowledges arbitrary button clicks (ex. open a link in a new tab)
app.action('link_button', async ({ack}) => ack());

/* ------------- ANCHOR Responding to the repo name selection ------------ */

app.action('main_view_scope_selection', async ({ack, body, context, client}) => {
  await ack();
  try {
    const action_body = body.actions[0];

    const {selected_option} = action_body;

    const selected_repo_path = selected_option.text.text;

    const selected_repo_id = selected_option.value;

    console.log('selected_repo_path', selected_repo_path);

    console.log('selected_repo_id', selected_repo_id);

    user_app_home_state_obj.set_selected_repo({
      repo_path: selected_repo_path,
      repo_id: selected_repo_id,
    });

    // If the selection is All untriaged, then just show those cards
    if (
      selected_repo_path === default_selected_repo.repo_path &&
      selected_repo_id === default_selected_repo.repo_id
    ) {
      common_functions.show_all_untriaged_cards({
        triage_team_data_obj,
        user_app_home_state_obj,
        body,
        context,
        client,
      });

      return;
    }

    const updated_home_view = AppHome.BaseAppHome(user_app_home_state_obj);
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

    const home_view = AppHome.BaseAppHome(user_app_home_state_obj);
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
// TODO add column select menu to BaseAppHome
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
    // const cards_in_selected_column = triage_team_data_obj.subscribed_repo_map
    //   .get(user_app_home_state_obj.currently_selected_repo.repo_path)
    //   .repo_project_map.get(
    //     user_app_home_state_obj.currently_selected_repo
    //       .currently_selected_project.project_name
    //   ).columns;

    const cards_in_selected_column = triage_team_data_obj.get_cards_by_column(
      user_app_home_state_obj.get_selected_repo_path(),
      selected_project.project_name,
      column_name
    );

    console.log('cards_in_selected_column', cards_in_selected_column);

    const card_blocks = AppHome.CardsAppHome(cards_in_selected_column);
    console.log(': ------------------------');
    console.log('card_blocks');
    console.log(': ------------------------');

    const home_view = AppHome.BaseAppHome(user_app_home_state_obj, card_blocks);
    // (issue_blocks = blocks.CardsAppHome(cards_array, label_block)),
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
        SafeAccess(() => selected_options[0].value) ||
        SafeAccess(() => initial_options[0].value);

      const variables_clearAllLabels = {
        element_node_id: card_id,
      };

      // clear the current labels first
      await graphql.call_gh_graphql(mutation.clearAllLabels, variables_clearAllLabels);

      const repo_labels_map = triage_team_data_obj.get_team_repo_subscriptions(
        user_app_home_state_obj.get_selected_repo_path()
      ).repo_label_map;

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
        // REVIEW should I await the second one?
        await graphql.call_gh_graphql(mutation.clearAllLabels, variables_clearAllLabels);
        await graphql.call_gh_graphql(
          mutation.addLabelToIssue,
          variables_addLabelToIssue
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
options_listener.repo_proj_col_selections.repo_selection(app, triage_team_data_obj);

// Same as the repo_selection option, just has to be seperated for this action_id
app.options('setup_repo_defaults_repo_modal', async ({options, ack}) => {
  try {
    // TODO try using options directly
    console.log('options', options);

    const subscribed_repos = triage_team_data_obj.get_team_repo_subscriptions();

    console.log('subscribed_repos', subscribed_repos);

    if (subscribed_repos.size !== 0) {
      // const repo_options_block_list = Array.from(subscribed_repos.keys(), repo => {
      //   return SubBlocks.option_obj(repo);
      // });
      const repo_options_block_list = Array.from(subscribed_repos.keys()).map(repo => {
        return SubBlocks.option_obj(repo);
      });

      console.log('repo_options_block_list', repo_options_block_list);

      await ack({
        options: repo_options_block_list,
      });
    } else {
      const no_subscribed_repos_option = SubBlocks.option_obj(
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

    const selected_repo_path = user_app_home_state_obj.get_selected_repo_path();

    const subscribed_repo_projects = triage_team_data_obj.get_team_repo_subscriptions(
      selected_repo_path
    ).repo_project_map;

    if (subscribed_repo_projects.size !== 0) {
      const project_options_block_list = Array.from(
        subscribed_repo_projects.values()
      ).map(project => {
        return SubBlocks.option_obj(project.name, project.id);
      });

      console.log('project_options_block_list', project_options_block_list);

      await ack({
        options: project_options_block_list,
      });
    } else {
      const no_projects_option = SubBlocks.option_obj('No projects found', 'no_projects');
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

    const {repo_id} = triage_team_data_obj.get_team_repo_subscriptions(
      selected_repo_path
    );

    const org_level_projects_response = await graphql.call_gh_graphql(
      query.getOrgAndUserLevelProjects,
      {repo_id}
    );
    // TODO highest priority add OAuth
    const org_level_projects = SafeAccess(
      () => org_level_projects_response.node.owner.projects.nodes
    );

    // TODO HIGHEST the projects returned here should be the projects of the Organization/User not the repo

    // const subscribed_repo_projects = triage_team_data_obj.get_team_repo_subscriptions(
    //   selected_repo_path
    // ).repo_project_map;

    if (org_level_projects.size !== 0) {
      const project_options_block_list = Array.from(org_level_projects.values()).map(
        project => {
          return SubBlocks.option_obj(project.name, project.id);
        }
      );

      console.log('project_options_block_list', project_options_block_list);

      await ack({
        options: project_options_block_list,
      });
    } else {
      const no_projects_option = SubBlocks.option_obj('No projects found', 'no_projects');
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

    const selected_project_name = user_app_home_state_obj.get_selected_project_name();

    console.log(': --------------------------------------------');
    console.log('selected_project_name', selected_project_name);
    console.log(': --------------------------------------------');

    const selected_project_columns = triage_team_data_obj
      .get_team_repo_subscriptions(selected_repo_path)
      .repo_project_map.get(selected_project_name).columns;

    if (
      typeof selected_project_columns !== 'undefined' &&
      selected_project_columns.size !== 0
    ) {
      const column_options_block_list = Array.from(selected_project_columns.values()).map(
        column => {
          return SubBlocks.option_obj(column.name, column.id);
        }
      );

      console.log('column_options_block_list', column_options_block_list);

      await ack({
        options: column_options_block_list,
      });
    } else {
      const no_columns_option = SubBlocks.option_obj('No columns found', 'no_columns');
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

app.options('label_list', async ({options, ack}) => {
  try {
    console.log('options', options);
    // TODO if the options value specified a repo_path, then set that as the currently selected_repo_path
    // Get information specific to a team or channel
    const currently_selected_repo_path =
      user_app_home_state_obj.currently_selected_repo.repo_path;

    const currently_selected_repo_map = triage_team_data_obj.get_team_repo_subscriptions(
      currently_selected_repo_path
    );

    const options_response = Array.from(
      currently_selected_repo_map.repo_label_map.values()
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

    const currently_selected_repo_map = triage_team_data_obj.get_team_repo_subscriptions(
      currently_selected_repo_path
    );

    const options_response = Array.from(
      currently_selected_repo_map.repo_label_map.values()
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
      view: Modals.SetupShortcutStaticModal,
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
      view: Modals.ModifyRepoSubscriptionsModal(
        triage_team_data_obj.get_team_repo_subscriptions().keys()
      ),
    });

    console.log(result);
  } catch (error) {
    console.error(error);
  }
});

// TODO potentially seperate the add/remove repo shortcuts
// app.shortcut('add_repo_subscription', async ({shortcut, ack, context, client}) => {
//   try {
//     // Acknowledge shortcut request
//     await ack();

//     // Call the views.open method using one of the built-in WebClients
//     const result = await client.views.open({
//       // The token you used to initialize your app is stored in the `context` object
//       token: context.botToken,
//       trigger_id: shortcut.trigger_id,
//       view: Modals.AddRepoSubscriptionModal(
//         triage_team_data_obj.get_team_repo_subscriptions().keys()
//       ),
//     });

//     console.log(result);
//   } catch (error) {
//     console.error(error);
//   }
// });

// app.shortcut('remove_repo_subscription', async ({shortcut, ack, context, client}) => {
//   try {
//     // Acknowledge shortcut request
//     await ack();

//     // Call the views.open method using one of the built-in WebClients
//     const result = await client.views.open({
//       // The token you used to initialize your app is stored in the `context` object
//       token: context.botToken,
//       trigger_id: shortcut.trigger_id,
//       view: Modals.ModifyRepoSubscriptionsModal(
//         triage_team_data_obj.get_team_repo_subscriptions().keys()
//       ),
//     });

//     console.log(result);
//   } catch (error) {
//     console.error(error);
//   }
// });

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
      blocks: Messages.UsernameMapMessage(user_id),
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
  const msg =
    selected_users_array.length !== 0
      ? 'Team members assigned successfully'
      : 'There was an error with your submission';

  // Assign the members to the team
  selected_users_array.forEach(user_id => triage_team_data_obj.set_team_member(user_id));

  // Set the team channel
  // TODO maybe we should update the DB at this point
  const team_channel_id = triage_team_data_obj.assign_team_channel(selected_channel);

  if (team_channel_id !== selected_channel) {
    console.log('Team channel assignment failed');
    return;
  }

  console.log('triage_team_data_obj', triage_team_data_obj);

  // Message the user
  try {
    await app.client.chat.postMessage({
      token: context.botToken,
      channel: user,
      text: msg,
    });

    const team_member_ids = triage_team_data_obj.team_data.team_members.keys();

    // Message the team members that were added to ask for their github usernames
    for (const slack_user_id of team_member_ids) {
      app.client.chat.postMessage({
        token: context.botToken,
        channel: slack_user_id,
        text:
          `Hey <@${slack_user_id}>! ` +
          "You've been added to the triage team. Tell me your GitHub username.",
        blocks: Messages.UsernameMapMessage(slack_user_id),
      });
    }
  } catch (error) {
    console.error(error);
  }
});

views_listener.ModifyRepoSubscriptionsModalView(
  app,
  triage_team_data_obj,
  user_app_home_state_obj
);

app.view('map_username_modal', async ({ack, body, view, context}) => {
  // Acknowledge the view_submission event
  await ack();

  console.log(view.state.values);

  const github_username =
    view.state.values.map_username_block.github_username_input.value;

  console.log('github username', github_username);

  // RegExp for checking the username
  const github_username_checker = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

  const valid_github_username = github_username_checker.test(github_username);

  console.log(': --------------------------------------------');
  console.log('valid_github_username', valid_github_username);
  console.log(': --------------------------------------------');

  const slack_user_id = body.user.id;

  console.log('slack_user_id ', slack_user_id);

  if (!valid_github_username) {
    // TODO maybe open a modal
    console.log(`${github_username} is not a valid github username`);
    try {
      await app.client.chat.postMessage({
        token: context.botToken,
        channel: slack_user_id,
        text: `Hey <@${slack_user_id}>,  ${github_username} is not a valid GitHub username. Please double check your spelling. `,
      });
    } catch (error) {
      console.error(error);
    }
    return;
  }

  const slack_id_to_gh_username_match = triage_team_data_obj.get_team_member_by_github_username(
    github_username
  );
  /* REVIEW potentially message the user or open a confirmation modal of some sort if the user already has a github username 
  setup. This would actually be better done on the actual modal before submission. The modal should show the person's current
  github name, and it should be a confirm type modal 
  TODO all the above stuff */
  // if (Object.keys(github_username_to_slack_id_match).length !== 0) {
  //   // Message the user
  //   try {
  //     await app.client.chat.postMessage({
  //       token: context.botToken,
  //       channel: slack_user_id,
  //       text:
  //         `<@${slack_user_id}>, ` +
  //         'your Slack and Github usernames were associated successfully! Your GitHub username is currently set to' +
  //         ` ${github_username}. ` +
  //         "If that doesn't look right, click the enter github username button again.",
  //     });
  //   } catch (error) {
  //     console.error(error);
  //   }
  //   return;
  // }

  if (slack_id_to_gh_username_match.length === 0) {
    // We map the github username to that Slack username
    triage_team_data_obj.set_team_member(slack_user_id, github_username);

    console.log(': ------------------------------------------------------------');
    console.log('slack_id_to_gh_username_match', slack_id_to_gh_username_match);
    console.log(': ------------------------------------------------------------');

    console.log(': ------------------------------------------');
    console.log(
      'Success map added check',
      triage_team_data_obj.get_team_member_by_github_username(github_username)
    );
    console.log(': ------------------------------------------');

    // Message the user
    try {
      await app.client.chat.postMessage({
        token: context.botToken,
        channel: slack_user_id,
        text:
          `<@${slack_user_id}>, ` +
          'your Slack and Github usernames were associated successfully! Your GitHub username is currently set to' +
          ` ${github_username}. ` +
          "If that doesn't look right, click the enter github username button again.",
      });
    } catch (error) {
      console.error(error);
    }
  }
});

// Listens for the submission of the untriaged issue flow/settings modal
app.view('repo_new_issue_defaults_modal', async ({ack, body, view, context}) => {
  // Acknowledge the view_submission event
  await ack();

  const slack_user_id = body.user.id;

  const view_values = view.state.values;

  const {repo_path} = JSON.parse(view.private_metadata);

  const default_untriaged_issues_label =
    view_values.untriaged_label_block_input.setup_default_modal_label_list
      .selected_option;

  const default_untriaged_issues_project =
    view_values.untriaged_project_block_input.setup_default_modal_project_selection
      .selected_option;

  // set default project name
  triage_team_data_obj.set_default_untriaged_project(repo_path, {
    project_name: default_untriaged_issues_project.text.text,
    project_id: default_untriaged_issues_project.value,
  });
  // Link repo to said project
  // await graphql.call_gh_graphql(mutation.linkRepoToOrgLevelProject, {
  //   project_id: default_untriaged_issues_project.value,
  //   repo_id: triage_team_data_obj.get_team_repo_subscriptions(repo_path).repo_id,
  // });

  // set default label obj
  triage_team_data_obj.set_untriaged_label(repo_path, {
    label_id: default_untriaged_issues_label.value,
    label_name: default_untriaged_issues_label.text.text,
  });

  console.log(': --------------------------------------------------------------');
  console.log('default_untriaged_issues_label', default_untriaged_issues_label);
  console.log(': --------------------------------------------------------------');

  console.log(': ------------------------------------------------------------------');
  console.log('default_untriaged_issues_project', default_untriaged_issues_project);
  console.log(': ------------------------------------------------------------------');

  console.log(': ------------------------------------------------------------------');
  console.log(
    'untriaged settings repo with defaults applied',
    triage_team_data_obj.team_data.subscribed_repo_map.get(repo_path).untriaged_settings
  );
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

    // eslint-disable-next-line no-unused-vars
    const {full_name: repo_path, id: repo_id} = request.repository;

    console.log(': --------------------');
    console.log('repo_path', repo_path);
    console.log(': --------------------');

    // TODO: Handle other event types. Currently, it's just issue-related events
    if (req.headers['x-github-event'] === 'issues') {
      // TODO Use destructuring here
      const issue_url = request.issue.html_url;
      const issue_title = request.issue.title;
      const issue_body = request.issue.body;
      const issue_creator = request.issue.user.login;
      const creator_avatar_url = request.issue.user.avatar_url;
      const issue_create_date = new Date(request.issue.created_at);
      const issue_node_id = request.issue.node_id;

      const repo_obj = triage_team_data_obj.get_team_repo_subscriptions(repo_path);
      console.log(': ------------------');
      console.log('repo_obj', repo_obj);
      console.log(': ------------------');

      // QUESTION: Should editing the issue also cause the untriaged label to be added?
      if (action === 'opened' || action === 'reopened') {
        const untriaged_label_id = repo_obj.untriaged_settings.untriaged_label.label_id;
        const variables_addLabelToIssue = {
          element_node_id: issue_node_id,
          label_ids: [untriaged_label_id],
        };
        // TODO seperate this. The adding of the untriaged label event should trigger this.
        // const variables_assignIssueToProject = {
        //   issue_id: issue_node_id,
        //   project_ids: [
        //     triage_team_data_obj.get_team_repo_subscriptions(repo_path).untriaged_settings
        //       .repo_default_untriaged_project.project_id,
        //   ],
        // };

        // eslint-disable-next-line no-unused-vars
        const addLabelMutation = graphql
          .call_gh_graphql(mutation.addLabelToIssue, variables_addLabelToIssue, {
            repo_owner: repo_obj.repo_owner,
            repo_name: repo_obj.repo_name,
          })
          .then(addLabelMutation_response => {
            console.log('addLabelMutation_response', addLabelMutation_response);
            return addLabelMutation_response;
          })
          .catch(error => console.error(error));

        console.log(': ----------------------------------');
        console.log('addLabelMutation', addLabelMutation);
        console.log(': ----------------------------------');

        const mention_event_data = {
          channel_id: temp_channel_id,
          title: issue_title,
          text_body: issue_body,
          content_url: issue_url,
          content_creator: issue_creator,
          creator_avatar_url,
          content_create_date: issue_create_date,
        };

        // TODO: instead of channel id, send over the users_triage_team object or don't and do it in the function
        check_for_mentions(mention_event_data);
      } else if (action === 'labeled') {
        /* ---- ANCHOR What to do  there is a label added or removed from an issue ---- */
        // const issue_label_array = request.issue.labels;

        const label_id = request.label.node_id;
        const untriaged_label_id = repo_obj.untriaged_settings.untriaged_label.label_id;

        console.log(': ------------------');
        console.log('label_id', label_id);
        console.log(': ------------------');

        console.log(': --------------------------------------------------');
        console.log('untriaged_label id', untriaged_label_id);
        console.log(': --------------------------------------------------');

        if (label_id === untriaged_label_id) {
          const variables_assignIssueToProject = {
            issue_id: issue_node_id,
            project_ids: [
              triage_team_data_obj.get_team_repo_subscriptions(repo_path)
                .untriaged_settings.repo_default_untriaged_project.project_id,
            ],
          };

          // TODO: Create a card in the org-wide repo to indicate the presence of this untriaged issue
          // Assigns the project to the selected issue
          // TODO: let the user select a default project
          const assignIssueToProjectMutation = graphql
            .call_gh_graphql(
              mutation.assignIssueToProject,
              variables_assignIssueToProject
            )
            .then(assignIssueToProjectMutation_response => {
              console.log(
                'assignIssueToProjectMutation_response',
                assignIssueToProjectMutation_response
              );
              return assignIssueToProjectMutation_response;
            })
            .catch(error => console.error(error));

          console.log(': ----------------------------------');
          console.log('assignIssueToProjectMutation', assignIssueToProjectMutation);
          console.log(': ----------------------------------');
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
        const label_id = request.label.node_id;
        const untriaged_label_id = repo_obj.untriaged_settings.untriaged_label.label_id;

        console.log(': ------------------');
        console.log('label_id', label_id);
        console.log(': ------------------');

        console.log(': --------------------------------------------------');
        console.log('untriaged_label id', untriaged_label_id);
        console.log(': --------------------------------------------------');
      }
    } else if (req.headers['x-github-event'] === 'issue_comment') {
      const issue_url = request.issue.html_url;
      const issue_title = request.issue.title;
      const comment_body = request.comment.body;
      const comment_creator = request.comment.user.login;
      const creator_avatar_url = request.comment.user.avatar_url;
      const comment_create_date = new Date(request.comment.created_at);

      if (req.body.issue.state === 'closed') {
        const mention_event_data = {
          channel_id: temp_channel_id,
          title: `Comment on closed issue: ${issue_title}`,
          body: comment_body,
          url: issue_url,
          creator: comment_creator,
          avatar_url: creator_avatar_url,
          create_date: comment_create_date,
          mentioned_slack_user: '!channel',
          is_issue_closed: true,
        };

        send_mention_message(mention_event_data);
      }

      const mention_event_data = {
        channel_id: temp_channel_id,
        title: `New comment on issue: ${issue_title}`,
        text_body: comment_body,
        content_url: issue_url,
        content_creator: comment_creator,
        creator_avatar_url,
        content_create_date: comment_create_date,
      };

      check_for_mentions(mention_event_data);
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

// TODO: Get user's timezone and display the date/time with respect to it
/**
 *
 *
 * @param {{channel_id:string, title:string, body:string, url:string, creator:string, avatar_url:string, create_date:string, mentioned_slack_user:string, is_issue_closed:boolean }} mention_event_data
 */
function send_mention_message(mention_event_data) {
  const {
    channel_id,
    title,
    url,
    creator,
    create_date,
    mentioned_slack_user,
    is_issue_closed,
  } = mention_event_data;
  app.client.chat.postMessage({
    // Since there is no context we just use the original token
    token: process.env.SLACK_BOT_TOKEN,
    // Conditional on whether the message should go to channel or just to a user as a DM
    ...(is_issue_closed
      ? {
          channel: channel_id,
          blocks: Messages.GithubMentionMessage(mention_event_data),
        }
      : {
          channel: mentioned_slack_user,
          blocks: Messages.GithubMentionMessage(
            Object.assign(mention_event_data, {
              mentioned_slack_user: `@${mentioned_slack_user}`,
            })
          ),
        }),

    text: `<@${mentioned_slack_user}>! ${title} posted by ${creator} on ${create_date}. Link: ${url}`,
  });
}

// // TODO: Function that lets user see all the username mappings with a slash command
// function view_username_mappings(username_mappings) {
//   console.log(username_mappings);
// }

// Function that checks for github username mentions in a body of text
function check_for_mentions({
  channel_id,
  title,
  text_body,
  content_url,
  content_creator,
  creator_avatar_url,
  content_create_date,
}) {
  /* Since the regex contains a global operator, matchAll can used to get all the matches & the groups as an iterable.
  In this first version, we don't need to use substring(1) to drop the @ since contains_mention would also have just the usernames. */

  const contains_mention = text_body.match(/\B@([a-z0-9](?:-?[a-z0-9]){0,38})/gi);

  // Checks to see if the body mentions a username
  if (contains_mention) {
    contains_mention.forEach(mentioned_username => {
      const github_username = mentioned_username.substring(1);

      console.log(`mentioned gh username: ${github_username}`);

      const mentioned_slack_user = triage_team_data_obj.get_team_member_by_github_username(
        github_username
      ).slack_user_id;

      console.log(`mentioned slack user: ${mentioned_slack_user}`);

      // If the mentioned username is associated with a Slack username, mention that person
      const mention_event_data = {
        channel_id,
        title,
        body: text_body,
        url: content_url,
        creator: content_creator,
        avatar_url: creator_avatar_url,
        create_date: content_create_date,
        mentioned_slack_user,
        is_issue_closed: false,
      };

      if (mentioned_slack_user) {
        send_mention_message(mention_event_data);
      }
    });
  }
}

// !SECTION
