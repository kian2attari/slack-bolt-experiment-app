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
const {connectToMongoCollection} = require('./db');
const {review_request_cron_job, triage_duty_rotation} = require('./cronJobs');

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

actions_listener.buttons.show_up_for_grabs_filter_button(app);

actions_listener.buttons.show_assigned_to_user_filter_button(app);

actions_listener.buttons.show_done_by_user_filter_button(app);

actions_listener.buttons.app_home_external_triage_buttons(app);

actions_listener.buttons.app_home_internal_triage_buttons(app);

actions_listener.buttons.show_untriaged_filter_button(app);

actions_listener.buttons.setup_triage_workflow_button(app);

actions_listener.buttons.link_button(app);

/* ------------- ANCHOR Responding to the repo name selection ------------ */
actions_listener.main_level_filter_selection(app);

/* ------------- ANCHOR Responding to label assignment on issue ------------- */

/* ------ TODO - add a clear all labels button ----- */
actions_listener.label_assignment(app);

// !SECTION

/* ----------------------- SECTION Listen for options ----------------------- */
// Responding to a repo_selection options with list of repos

options_listener.org_level_project_input(app);

options_listener.assignable_team_members(app);

options_listener.github_org_select_input(app);

// !SECTION

/* -------------------------------------------------------------------------- */
/*                       SECTION Listening for shortcuts                       */
/* -------------------------------------------------------------------------- */

shortcuts_listener.setup_triage_workflow(app);

shortcuts_listener.modify_github_username(app);

shortcuts_listener.edit_triage_duty_availability(app);

// !SECTION Listening for shortcuts

/* -------------------------------------------------------------------------- */
/*                   SECTION Listening for view submissions                   */
/* -------------------------------------------------------------------------- */

views_listener.setup_triage_team_view(app);

views_listener.map_username_modal_view(app);

views_listener.setup_org_project_modal_view(app);

views_listener.edit_triage_duty_availability_modal(app);

// !SECTION Listening for view submissions
/* -------------------------------------------------------------------------- */
/*                     SECTION Where webhooks are received                    */
/* -------------------------------------------------------------------------- */

expressReceiver.router.use(json({type: 'application/json'}));

github_event(expressReceiver.router, app);

// !SECTION

/* -------------------------------------------------------------------------- */
/*                          SECTION Where app starts                          */
/* -------------------------------------------------------------------------- */

(async () => {
  // Test DB connection
  try {
    await connectToMongoCollection();
    review_request_cron_job(app);
    triage_duty_rotation(app);
  } catch (error) {
    console.error('Test connection to database failed.', error);
    throw error;
  }

  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();

// !SECTION
