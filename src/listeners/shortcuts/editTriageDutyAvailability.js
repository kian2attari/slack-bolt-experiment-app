const {Modals} = require('../../blocks');
const {getTeamTriageDutyAssignments} = require('../../models');

exports.editTriageDutyAvailability = app => {
  app.shortcut(
    'edit_triage_duty_availability',
    async ({shortcut, ack, context, client}) => {
      try {
        // Acknowledge shortcut request
        await ack();

        const slackUserId = shortcut.user.id;

        const teamData = await getTeamTriageDutyAssignments(slackUserId);

        const {triageDutyAssignments} = teamData[0];

        console.log('triageDutyAssignments', triageDutyAssignments);

        // Call the views.open method using one of the built-in WebClients
        const result = await client.views.open({
          // The token you used to initialize your app is stored in the `context` object
          token: context.botToken,
          'trigger_id': shortcut.trigger_id,
          view: Modals.EditTriageDutyAvailabilityModal(
            triageDutyAssignments,
            slackUserId
          ),
        });

        console.log(result);
      } catch (error) {
        console.error(error);
      }
    }
  );
};
