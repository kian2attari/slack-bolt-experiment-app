const {App, LogLevel, ExpressReceiver} = require('@slack/bolt');
const {json} = require('express');
const {githubEvent} = require('./webhooks/webhookEvents');
const {
  actionsListener,
  eventsListener,
  optionsListener,
  messagesListener,
  viewsListener,
  shortcutsListener,
} = require('./listeners');
const {connectToMongoCollection} = require('./db');
const {reviewRequestCronJob, triageDutyRotation} = require('./cronJobs');

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
  logLevel: process.env.SLACK_LOG_LEVEL || LogLevel.DEBUG,
});

// TODO Organize these listeners into their own modules by function

/* ----------------------- SECTION Listening for messages ---------------------- */
messagesListener.triageChannel(app);

// !SECTION

/* ----------------------- SECTION Listening for events ---------------------- */

/* -------------------------- ANCHOR App Home View events -------------------------- */
// Loads the app home when the app home is opened!
// ANCHOR App home opened
eventsListener.appHomeOpened(app);

// ANCHOR reaction added
eventsListener.reactionAdded(app);
// !SECTION

/* ------------- SECTION Listening for actions ------------ */
// Opens the username map modal
actionsListener.buttons.openMapModalButton(app);

actionsListener.buttons.showUpForGrabsFilterButton(app);

actionsListener.buttons.showAssignedToUserFilterButton(app);

actionsListener.buttons.showDoneByUserFilterButton(app);

actionsListener.buttons.appHomeExternalTriageButtons(app);

actionsListener.buttons.appHomeInternalTriageButtons(app);

actionsListener.buttons.showUntriagedFilterButton(app);

actionsListener.buttons.setupTriageWorkflowButton(app);

actionsListener.buttons.linkButton(app);

/* ------------- ANCHOR Responding to the repo name selection ------------ */
actionsListener.mainLevelFilterSelection(app);

/* ------------- ANCHOR Responding to label assignment on issue ------------- */

/* ------ TODO - add a clear all labels button ----- */
actionsListener.labelAssignment(app);

// !SECTION

/* ----------------------- SECTION Listen for options ----------------------- */
// Responding to a repo_selection options with list of repos

optionsListener.orgLevelProjectInput(app);

optionsListener.assignableTeamMembers(app);

optionsListener.githubOrgSelectInput(app);

// !SECTION

/* -------------------------------------------------------------------------- */
/*                       SECTION Listening for shortcuts                       */
/* -------------------------------------------------------------------------- */

shortcutsListener.setupTriageWorkflow(app);

shortcutsListener.modifyGithubUsername(app);

shortcutsListener.editTriageDutyAvailability(app);

// !SECTION Listening for shortcuts

/* -------------------------------------------------------------------------- */
/*                   SECTION Listening for view submissions                   */
/* -------------------------------------------------------------------------- */

viewsListener.setupTriageTeamView(app);

viewsListener.mapUsernameModalView(app);

viewsListener.setupOrgProjectModalView(app);

viewsListener.editTriageDutyAvailabilityModal(app);

// !SECTION Listening for view submissions
/* -------------------------------------------------------------------------- */
/*                     SECTION Where webhooks are received                    */
/* -------------------------------------------------------------------------- */

expressReceiver.router.use(json({type: 'application/json'}));

githubEvent(expressReceiver.router, app);

// !SECTION

/* -------------------------------------------------------------------------- */
/*                          SECTION Where app starts                          */
/* -------------------------------------------------------------------------- */

(async () => {
  // Test DB connection
  try {
    await connectToMongoCollection();
    reviewRequestCronJob(app);
    triageDutyRotation(app);
  } catch (error) {
    console.error('Test connection to database failed.', error);
    throw error;
  }

  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();

// !SECTION
