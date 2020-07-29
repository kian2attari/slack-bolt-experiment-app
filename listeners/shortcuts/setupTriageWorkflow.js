const {Modals} = require('../../blocks');

module.exports = app => {
  app.shortcut('setup_triage_workflow', async ({shortcut, ack, context, client}) => {
    try {
      // Acknowledge shortcut request
      await ack();

      // Call the views.open method using one of the built-in WebClients
      const result = await client.views.open({
        // The token you used to initialize your app is stored in the `context` object
        token: context.botToken,
        trigger_id: shortcut.trigger_id,
        view: Modals.CreateTriageTeamModal,
      });

      console.log(result);
    } catch (error) {
      console.error(error);
    }
  });
};
