const {App, LogLevel, ExpressReceiver} = require('@slack/bolt');
const express = require('express');
const {mutation, graphql} = require('./graphql');
const {Messages} = require('./blocks');
const {
  actions_listener,
  events_listener,
  options_listener,
  views_listener,
  shortcuts_listener,
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

actions_listener.setup_defaults.modal_repo_selection(app);

// app.action('setup_default_triage_label_list', async ({ack}) => ack());

// app.action('setup_default_modal_column_selection', ({ack}) => ack());

actions_listener.buttons.link_button(app);

/* ------------- ANCHOR Responding to the repo name selection ------------ */
actions_listener.main_level_filter_selection(
  app,
  triage_team_data_obj,
  user_app_home_state_obj,
  default_selected_repo
);

/* ------------- ANCHOR Responding to project name selection ------------------- */
actions_listener.repo_level_filter.project_selection(app, user_app_home_state_obj);

/* ------------- ANCHOR Responding to column selection ------------------- */
// TODO add column select menu to BaseAppHome
actions_listener.repo_level_filter.column_selection(
  app,
  triage_team_data_obj,
  user_app_home_state_obj
);

/* ------------- ANCHOR Responding to label assignment on issue ------------- */

/* ------ TODO - add a clear all labels button ----- */
actions_listener.label_assignment(app, triage_team_data_obj, user_app_home_state_obj);

// !SECTION

/* ----------------------- SECTION Listen for options ----------------------- */
// Responding to a repo_selection options with list of repos
options_listener.main_level_filter_selection(app, triage_team_data_obj);

options_listener.project_col_selection.repo_project_options(
  app,
  triage_team_data_obj,
  user_app_home_state_obj
);

options_listener.project_col_selection.project_column_options(
  app,
  user_app_home_state_obj,
  triage_team_data_obj
);

options_listener.untriaged_defaults_selection.setup_defaults_repo_selection(
  app,
  triage_team_data_obj
);

options_listener.untriaged_defaults_selection.setup_default_project_selection(
  app,
  triage_team_data_obj
);

// TODO only show labels with description 'triage'
options_listener.untriaged_defaults_selection.setup_default_triage_label_list(
  app,
  triage_team_data_obj
);

// !SECTION

/* -------------------------------------------------------------------------- */
/*                       SECTION Listening for shortcuts                       */
/* -------------------------------------------------------------------------- */

shortcuts_listener.setup_triage_workflow(app);

shortcuts_listener.modify_repo_subscriptions(app, triage_team_data_obj);

shortcuts_listener.modify_github_username(app);

// !SECTION Listening for shortcuts

/* -------------------------------------------------------------------------- */
/*                   SECTION Listening for view submissions                   */
/* -------------------------------------------------------------------------- */

views_listener.setup_triage_team_view(app, triage_team_data_obj);

views_listener.modify_repo_subscriptions_view(
  app,
  triage_team_data_obj,
  user_app_home_state_obj
);

views_listener.map_username_modal_view(app, triage_team_data_obj);

views_listener.repo_new_issue_defaults_view(app, triage_team_data_obj);

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

        // REVIEW maybe we only assign the card to the org-wide repo?
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
      console.log(': --------------------------------------------------------------');
      console.log('contains_mention -> mentioned_slack_user', mentioned_slack_user);
      console.log(': --------------------------------------------------------------');

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
