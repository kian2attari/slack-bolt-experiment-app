const {Modals} = require('../../blocks');

module.exports = (app, triage_team_data_obj) => {
  app.shortcut('modify_repo_subscriptions', async ({shortcut, ack, context, client}) => {
    try {
      // Acknowledge shortcut request
      await ack();

      // Call the views.open method using one of the built-in WebClients
      const result = await client.views.open({
        // The token you used to initialize your app is stored in the `context` object
        token: context.botToken,
        trigger_id: shortcut.trigger_id,
        view: Modals.ModifyRepoSubscriptionsModal(
          triage_team_data_obj.get_team_repo_subscriptions().keys()
        ),
      });

      console.log(result);
    } catch (error) {
      console.error(error);
    }
  });
};

// TODO potentially seperate the add/remove repo shortcuts
// app.shortcut('add_repo_subscription', async ({shortcut, ack, context, client}) => {
//   try {
//     // Acknowledge shortcut request
//     await ack();

//     // Call the views.open method using one of the built-in WebClients
//     const result = await client.views.open({
//       // The token you used to initialize your app is stored in the `context` object
//       token: context.botToken,
//       trigger_id: shortcut.trigger_id,
//       view: Modals.AddRepoSubscriptionModal(
//         triage_team_data_obj.get_team_repo_subscriptions().keys()
//       ),
//     });

//     console.log(result);
//   } catch (error) {
//     console.error(error);
//   }
// });

// app.shortcut('remove_repo_subscription', async ({shortcut, ack, context, client}) => {
//   try {
//     // Acknowledge shortcut request
//     await ack();

//     // Call the views.open method using one of the built-in WebClients
//     const result = await client.views.open({
//       // The token you used to initialize your app is stored in the `context` object
//       token: context.botToken,
//       trigger_id: shortcut.trigger_id,
//       view: Modals.ModifyRepoSubscriptionsModal(
//         triage_team_data_obj.get_team_repo_subscriptions().keys()
//       ),
//     });

//     console.log(result);
//   } catch (error) {
//     console.error(error);
//   }
// });
