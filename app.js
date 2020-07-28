const {App, LogLevel, ExpressReceiver} = require('@slack/bolt');
const {json} = require('express');
const {github_event} = require('./webhooks/webhookEvents');
const {
  actions_listener,
  events_listener,
  options_listener,
  messages_listener,
  views_listener,
  shortcuts_listener,
} = require('./listeners');
const {test_connect} = require('./db');
const {UserAppHomeState, TriageTeamData} = require('./models');

// Create a Bolt Receiver
const expressReceiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Initializes your app with your bot token, signing secret, and receiver
// TODO remove debug setting when ready to prod
const app = new App({
  // Currently, this app runs on a single workspace
  // TODO: start using the built-in OAuth support to go multi-workspace (or multi-org)
  token: process.env.SLACK_BOT_TOKEN,
  receiver: expressReceiver,
  logLevel: LogLevel.DEBUG,
});

/* -------------------------------------------------------------------------- */
/*                             SECTION Data layer                             */
/* -------------------------------------------------------------------------- */
/* ---------------------------------------------- ANCHOR connect to DB ---------------------------------------------- */

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

// TODO get user's triage team channel ID

/* Data object for persistent triage team data such as team members (and their github usernames), 
the repos the team is subscribed to, and the triage team's channel */

// TODO store this in DB as team_discussion_channel_id -> triage_team_data_obj
// TODO remove this piece of state
const triage_team_data_obj = new TriageTeamData();
console.log(': ------------------------------------------');
console.log('triage_team_data_obj', triage_team_data_obj);
console.log(': ------------------------------------------');
// !SECTION

// TODO Organize these listeners into their own modules by function

/* ----------------------- SECTION Listening for messages ---------------------- */
// TODO pull traige-sdk channel id
/* TODO could use a middleware ex valid_triage_channel. It would take the channel_id and check 
with the DB to see if its a valid channel_id that is in use and get the context data */
messages_listener.triage_channel(app);

// !SECTION

/* ----------------------- SECTION Listening for events ---------------------- */

/* -------------------------- ANCHOR App Home View events -------------------------- */
// Loads the app home when the app home is opened!
// ANCHOR App home opened
events_listener.app_home_opened(
  app,
  triage_team_data_obj,
  user_app_home_state_obj,
  default_selected_repo
);

// ANCHOR reaction added
events_listener.reaction_added(app);
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

expressReceiver.router.use(json({type: 'application/json'}));

github_event(expressReceiver.router, triage_team_data_obj, app);

// !SECTION

/* -------------------------------------------------------------------------- */
/*                          SECTION Where app starts                          */
/* -------------------------------------------------------------------------- */

(async () => {
  // Test DB connection
  try {
    await test_connect();
  } catch (error) {
    console.error('Test connection to database failed.', error);
    throw error;
  }

  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();

// !SECTION
