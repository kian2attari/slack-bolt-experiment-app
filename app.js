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
const {Connection} = require('./db');
const {UserAppHomeState, TriageTeamData} = require('./models');
const {review_request_cron_job} = require('./cronJobs');

// Create a Bolt Receiver
const expressReceiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Initializes your app with your bot token, signing secret, and receiver
const app = new App({
  // Currently, this app runs on a single workspace
  // EXTRA_TODO: start using the built-in OAuth support to go multi-workspace (or multi-org)
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

/* Data object for persistent triage team data such as team members (and their github usernames), 
the repos the team is subscribed to, and the triage team's channel */

// TODO remove this piece of state
const triage_team_data_obj = new TriageTeamData();
console.log(': ------------------------------------------');
console.log('triage_team_data_obj', triage_team_data_obj);
console.log(': ------------------------------------------');
// !SECTION

// TODO Organize these listeners into their own modules by function

/* ----------------------- SECTION Listening for messages ---------------------- */
messages_listener.triage_channel(app);

// !SECTION

/* ----------------------- SECTION Listening for events ---------------------- */

/* -------------------------- ANCHOR App Home View events -------------------------- */
// Loads the app home when the app home is opened!
// ANCHOR App home opened
events_listener.app_home_opened(app);

// ANCHOR reaction added
events_listener.reaction_added(app);
// !SECTION

/* ------------- SECTION Listening for actions ------------ */
// Opens the username map modal
actions_listener.buttons.open_map_modal_button(app);

// Opens the modal for setting default repos
actions_listener.buttons.open_set_repo_defaults_modal_button(app);

actions_listener.buttons.show_up_for_grabs_filter_button(app);

actions_listener.buttons.show_assigned_to_user_filter_button(app);

actions_listener.buttons.show_done_by_user_filter_button(app);

actions_listener.buttons.app_home_external_triage_buttons(app);

actions_listener.buttons.app_home_internal_triage_buttons(app);

actions_listener.buttons.show_untriaged_filter_button(
  app,
  triage_team_data_obj,
  user_app_home_state_obj
);

actions_listener.setup_defaults.setup_defaults_repo_selection(app);

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

// /* ------------- ANCHOR DEPRECATED Responding to project name selection ------------------- */
// actions_listener.repo_level_filter.project_selection(app, user_app_home_state_obj);

// /* ------------- ANCHOR DEPRECATED Responding to column selection ------------------- */
// // TODO add column select menu to BaseAppHome
// actions_listener.repo_level_filter.column_selection(
//   app,
//   triage_team_data_obj,
//   user_app_home_state_obj
// );

/* ------------- ANCHOR Responding to label assignment on issue ------------- */

/* ------ TODO - add a clear all labels button ----- */
actions_listener.label_assignment(app, triage_team_data_obj, user_app_home_state_obj);

// !SECTION

/* ----------------------- SECTION Listen for options ----------------------- */
// Responding to a repo_selection options with list of repos
// options_listener.main_level_filter_selection(app, triage_team_data_obj);

/* TODO org_level_project_input doesnt belong with untriaged_defaults_selection. 
a sub-module like setup_team_settings would make more sense */
options_listener.untriaged_defaults_selection.org_level_project_input(app);

options_listener.project_col_selection.repo_project_options(
  app,
  triage_team_data_obj,
  user_app_home_state_obj
);

// Change the defaults for one particular repo
options_listener.untriaged_defaults_selection.setup_defaults_repo_selection(
  app,
  triage_team_data_obj
);

options_listener.untriaged_defaults_selection.github_org_select_input(
  app,
  triage_team_data_obj
);

options_listener.untriaged_defaults_selection.setup_default_triage_label_list(
  app,
  triage_team_data_obj
);

// !SECTION

/* -------------------------------------------------------------------------- */
/*                       SECTION Listening for shortcuts                       */
/* -------------------------------------------------------------------------- */

shortcuts_listener.setup_triage_workflow(app);

shortcuts_listener.modify_github_username(app);

// !SECTION Listening for shortcuts

/* -------------------------------------------------------------------------- */
/*                   SECTION Listening for view submissions                   */
/* -------------------------------------------------------------------------- */

views_listener.setup_triage_team_view(app, triage_team_data_obj);

views_listener.map_username_modal_view(app, triage_team_data_obj);

views_listener.setup_org_project_modal_view(app, triage_team_data_obj);

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
    await Connection.connectToMongoCollection();
    review_request_cron_job(app);
  } catch (error) {
    console.error('Test connection to database failed.', error);
    throw error;
  }

  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();

// !SECTION
