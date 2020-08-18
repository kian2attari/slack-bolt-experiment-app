const {Modals} = require('../../blocks');
const {
  showUntriagedCards,
  updateInternalTriageStatusInDb,
  showTriagedCards,
} = require('../commonFunctions');
const {findTriageTeamBySlackUser} = require('../../db');
const {addLabelsToCard, getGithubUsernameByUserId} = require('../../models');
const {SafeAccess} = require('../../helper-functions');
const {regExp} = require('../../constants');

/** @param {App} app */
async function openMapModalButton(app) {
  app.action('open_map_modal_button', async ({ack, body, context, client}) => {
    // Here we acknowledge receipt
    await ack();

    const userSlackId = body.user.id;

    const userSetGithubUsername = (await getGithubUsernameByUserId(userSlackId)) || '';

    console.log('open_map_modal_button user_set_github_username', userSetGithubUsername);

    // User has set a github username
    await client.views.open({
      token: context.botToken,
      'trigger_id': body.trigger_id,
      view: Modals.UsernameMapModal(userSetGithubUsername),
    });
  });
}

function showUntriagedFilterButton(app) {
  // The app home 'Untriaged' filter button
  app.action('show_untriaged_filter_button', async ({ack, body, context, client}) => {
    // Here we acknowledge receipt
    await ack();

    await showUntriagedCards({
      body,
      context,
      client,
    });
  });
}
// All the cards in the To Do column that have been triaged but not assigned

function showUpForGrabsFilterButton(app) {
  app.action('show_up_for_grabs_filter_button', async ({ack, body, context, client}) => {
    await ack();
    // Only get internal issues that havent been claimed!
    const internalIssueFilterCallbackGenerator = () => internalIssue =>
      typeof internalIssue.issueTriageData === 'undefined';

    // Only issues/PR's that are triaged but not assigned to anyone!
    const externalCardFilterCallbackGenerator = () => card =>
      card.content.labels.nodes.some(label =>
        regExp.findTriageLabels.test(label.description)
      ) && card.content.assignees.nodes.length === 0;

    try {
      await showTriagedCards(
        {body, context, client},
        'show_up_for_grabs_filter_button',
        internalIssueFilterCallbackGenerator,
        externalCardFilterCallbackGenerator,
        'To Do'
      );
    } catch (error) {
      console.error(error);
    }
  });
}
// All cards in the In Progress Column that are assigned to the user
function showAssignedToUserFilterButton(app) {
  app.action(
    'show_assigned_to_user_filter_button',
    async ({ack, body, context, client}) => {
      await ack();

      const internalIssueFilterCallbackGenerator = userId => internalIssue =>
        // SafeAccess is used because untriaged issues don't have issueTriageData
        /* REVIEW it's probably better to set up the DB so that untriaged internal issues and triaged internal issues are in separate objects. Every internal issue that gets triaged is
       moved to the triaged internal issues section. That way, this complex filtering wont be necessary. */
        SafeAccess(() => internalIssue.issueTriageData.actingTeamMemberUserId) ===
          userId && internalIssue.issueTriageData.status === 'seen';

      const externalCardFilterCallbackGenerator = userGithubUsername => card =>
        card.content.assignees.nodes.some(user => {
          console.log('userGithubUsername', userGithubUsername);
          console.log('user.login', user.login);
          console.log('is_equal?', user.login === userGithubUsername);
          return user.login === userGithubUsername;
        });

      try {
        await showTriagedCards(
          {body, context, client},
          'show_assigned_to_user_filter_button',
          internalIssueFilterCallbackGenerator,
          externalCardFilterCallbackGenerator,
          'In Progress',
          true,
          false,
          body.user.id
        );
      } catch (error) {
        console.error(error);
      }
    }
  );
}

// All cards in the Done Column that are assigned to the user
function showDoneByUserFilterButton(app) {
  app.action('show_done_by_user_filter_button', async ({ack, body, context, client}) => {
    await ack();

    const internalIssueFilterCallbackGenerator = userId => internalIssue =>
      // SafeAccess is used because untriaged issues don't have issueTriageData
      /* REVIEW it's probably better to set up the DB so that untriaged internal issues and triaged internal issues are in separate objects. Every internal issue that gets triaged is
   moved to the triaged internal issues section. That way, this complex filtering wont be necessary. */
      SafeAccess(() => internalIssue.issueTriageData.actingTeamMemberUserId) === userId &&
      internalIssue.issueTriageData.status === 'done';

    const externalCardFilterCallbackGenerator = userGithubUsername => card =>
      card.content.assignees.nodes.some(user => user.login === userGithubUsername) &&
      card.content.closed;

    try {
      await showTriagedCards(
        {body, context, client},
        'show_done_by_user_filter_button',
        internalIssueFilterCallbackGenerator,
        externalCardFilterCallbackGenerator,
        'Done',
        true,
        true
      );
    } catch (error) {
      console.error(error);
    }
  });
}

function appHomeExternalTriageButtons(app) {
  // EXTRA_TODO autogenerate this list based on the triage labels for a repo
  // EXTRA_TODO the internal and external button setup have a lot in common, pull that into a common function
  const externalTriageButtons = [
    'assign_bug_label',
    'assign_tests_label',
    'assign_discussion_label',
    'assign_docs_label',
    'assign_enhancement_label',
    'assign_question_label',
  ];

  externalTriageButtons.forEach(button =>
    app.action(button, async ({ack, body}) => {
      await ack();

      await addLabelsToCard(body.user.id, JSON.parse(body.actions[0].value));
    })
  );
}

function appHomeInternalTriageButtons(app) {
  const internalTriageButtons = new Map([
    ['assign_eyes_label', 'is looking :eyes: into this!'],
    ['assign_checkmark_label', 'has resolved :white_check_mark: this!'],
  ]);

  internalTriageButtons.forEach((responseText, button) =>
    app.action(button, async ({ack, body, context, client}) => {
      await ack();

      const {
        user: {id: reactingUserId},
        actions,
      } = body;

      // EXTRA_TODO turn this find channel id query into its own function perhaps
      const response = await findTriageTeamBySlackUser(reactingUserId, {
        teamInternalTriageChannelId: 1,
      });

      const {teamInternalTriageChannelId} = response[0];

      const {name, issueMessageTs} = JSON.parse(actions[0].value);
      try {
        await Promise.all([
          client.reactions.add({
            token: context.botToken,
            channel: teamInternalTriageChannelId, // Review is there a better way to get this id?
            name,
            timestamp: issueMessageTs,
          }),
          client.chat.postMessage({
            token: context.botToken,
            channel: teamInternalTriageChannelId, // Review is there a better way to get this id?
            'thread_ts': issueMessageTs,
            text: `<@${reactingUserId}> ${responseText}`,
          }),
          updateInternalTriageStatusInDb({
            user: reactingUserId,
            reaction: button === 'assign_eyes_label' ? 'eyes' : 'white_check_mark',
            eventTs: actions[0].action_ts,
            channel: teamInternalTriageChannelId,
            issueMessageTs,
          }),
        ]);
      } catch (error) {
        console.error(error);
      }
    })
  );
}

// Acknowledges arbitrary button clicks (ex. open a link in a new tab)
function linkButton(app) {
  app.action('link_button', async ({ack}) => {
    console.log('link button pressed!');
    ack();
  });
}

// A user that isn't currently associated with a team pressed the create new team button!
function setupTriageWorkflowButton(app) {
  app.action('setup_triage_workflow_button', async ({ack, body, context, client}) => {
    ack();

    await client.views.open({
      // The token you used to initialize your app is stored in the `context` object
      token: context.botToken,
      'trigger_id': body.trigger_id,
      view: Modals.CreateTriageTeamModal,
    });
  });
}

module.exports = {
  openMapModalButton,
  showUntriagedFilterButton,
  linkButton,
  showUpForGrabsFilterButton,
  showAssignedToUserFilterButton,
  showDoneByUserFilterButton,
  appHomeExternalTriageButtons,
  appHomeInternalTriageButtons,
  setupTriageWorkflowButton,
};
