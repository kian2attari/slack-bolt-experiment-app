const {Messages, Modals} = require('../../blocks');
const {
  associateTeamWithInstallation,
  gitwaveUserData: {addNewUsers},
} = require('../../models');
const {SafeAccess} = require('../../helper-functions');

module.exports = app => {
  app.view('setup_triage_workflow_view', async ({ack, body, view, context}) => {
    // Acknowledge the view_submission event
    await ack();

    const {values} = view.state;

    const user = body.user.id;

    const selectedUsersArray = values.users_select_input.triage_users.selected_users;

    const selectedDiscussionChannel =
      values.discussion_channel_select_input.discussion_channel.selected_channel;

    const selectedInternalTriageChannel =
      values.triage_channel_select_input.triage_channel.selected_channel;

    if (selectedDiscussionChannel === selectedInternalTriageChannel) {
      // TODO Open a modal to tell the user they cant have the same channel for both
      return;
    }
    // if this is null, that means it's an existing team being modified
    const selectedGithubOrg = SafeAccess(
      () => values.github_org_input_block.github_org_select_input.selected_option
    );
    const createNewTeamResult = selectedGithubOrg
      ? await associateTeamWithInstallation(
          app,
          selectedUsersArray,
          selectedDiscussionChannel,
          selectedInternalTriageChannel,
          selectedGithubOrg
        )
      : await associateTeamWithInstallation(
          app,
          selectedUsersArray,
          selectedDiscussionChannel,
          selectedInternalTriageChannel,
          selectedGithubOrg,
          JSON.parse(view.private_metadata).gitwaveGithubAppInstallationId
        );

    if (createNewTeamResult.result.n !== 1) {
      // TODO if the error is that the team already exists, explain this to the user
      const errorMsg =
        "There was an error creating the team and adding it to the DB. Make sure it doesn't already exist";

      console.error(errorMsg);

      await app.client.chat.postMessage({
        token: context.botToken,
        channel: user,
        text: errorMsg,
      });
      return;
    }

    try {
      await addNewUsers(selectedUsersArray);
      // Message the creator of the team
      await app.client.chat.postMessage({
        token: context.botToken,
        channel: user,
        text: 'Team added successfully.',
      });

      // Open the org-level project selection modal
      await app.client.views.open({
        token: context.botToken,
        // Pass a valid trigger_id within 3 seconds of receiving it
        'trigger_id': body.trigger_id,
        // Show the org-level project board selection modal. The parameter is the organization's node ID
        view: Modals.setupOrgProjectModal(selectedGithubOrg.value),
      });
      // Message the team members that were added to ask for their github usernames
      for (const slackUserId of selectedUsersArray) {
        app.client.chat.postMessage({
          token: context.botToken,
          channel: slackUserId,
          text:
            `Hey <@${slackUserId}>! ` +
            "You've been added to the triage team. Tell me your GitHub username.",
          blocks: Messages.UsernameMapMessage(slackUserId),
        });
      }
    } catch (err) {
      console.error(err);
    }

    console.log('create_new_team_result', createNewTeamResult);
  });
};
