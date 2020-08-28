const {Modals} = require('../../blocks');
const {findTriageTeamBySlackUser} = require('../../db');

module.exports = app => {
  app.shortcut('setup_triage_workflow', async ({shortcut, ack, context, client}) => {
    try {
      // Acknowledge shortcut request
      await ack();

      const slackUserId = shortcut.user.id;

      let createTriageTeamModalInput = null;

      const triageTeam = await findTriageTeamBySlackUser(slackUserId, {
        teamMembers: 1,
        teamInternalTriageChannelId: 1,
        teamChannelId: 1,
        gitwaveGithubAppInstallationId: 1,
      });
      // TODO if the user is part of a triage team, then just show them the option to change the members and the 2 channels.
      try {
        const {
          teamMembers,
          teamInternalTriageChannelId,
          teamChannelId,
          gitwaveGithubAppInstallationId,
        } = triageTeam[0];

        if (
          teamMembers &&
          teamInternalTriageChannelId &&
          teamChannelId &&
          gitwaveGithubAppInstallationId
        ) {
          createTriageTeamModalInput = {
            teamMembers,
            teamChannelId,
            teamInternalTriageChannelId,
            gitwaveGithubAppInstallationId,
          };
        }
      } catch (error) {
        console.error(error);
      }

      // Call the views.open method using one of the built-in WebClients
      await client.views.open({
        // The token you used to initialize your app is stored in the `context` object
        token: context.botToken,
        'trigger_id': shortcut.trigger_id,
        view: Modals.CreateTriageTeamModal(createTriageTeamModalInput),
      });
    } catch (error) {
      console.error(error);
    }
  });
};
