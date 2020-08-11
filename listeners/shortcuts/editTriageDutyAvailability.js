const {Modals} = require('../../blocks');
const {get_team_triage_duty_assignments} = require('../../models');

exports.edit_triage_duty_availability = app => {
  app.shortcut(
    'edit_triage_duty_availability',
    async ({shortcut, ack, context, client}) => {
      try {
        // Acknowledge shortcut request
        await ack();

        const {triage_duty_assignments} = await get_team_triage_duty_assignments(
          shortcut.user.id
        );

        console.log('triage_duty_assignments', triage_duty_assignments);

        // Call the views.open method using one of the built-in WebClients
        const result = await client.views.open({
          // The token you used to initialize your app is stored in the `context` object
          token: context.botToken,
          trigger_id: shortcut.trigger_id,
          view: Modals.EditTriageDutyAvailabilityModal(triage_duty_assignments),
        });

        console.log(result);
      } catch (error) {
        console.error(error);
      }
    }
  );
};
