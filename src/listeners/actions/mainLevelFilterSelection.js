// const {AppHome} = require('../../blocks');
const {showUntriagedCards} = require('../commonFunctions');

module.exports = app => {
  app.action('main_level_filter_selection', async ({ack, body, context, client}) => {
    await ack();
    try {
      const actionBody = body.actions[0];

      const {selectedOption} = actionBody;

      const selectedMainLevelView = selectedOption.text.text;

      console.log('selected_main_level_view', selectedMainLevelView);

      // If the selection is All untriaged, then just show those cards
      if (selectedMainLevelView === 'All') {
        showUntriagedCards({
          body,
          context,
          client,
          selectedMainLevelView,
        });

        return;
      }

      // const updated_home_view = AppHome.BaseAppHome();
      // // QUESTION: should i use views.update or views.publish to update the app home view?
      // /* view.publish is the method that your app uses to push a view to the Home tab */
      // await client.views.update({
      //   /* retrieves your xoxb token from context */
      //   token: context.botToken,

      //   /* View to be updated */
      //   view_id: body.view.id,

      //   /* the view payload that appears in the app home */
      //   view: updated_home_view,
      // });
    } catch (error) {
      console.error(error);
    }
  });
};
