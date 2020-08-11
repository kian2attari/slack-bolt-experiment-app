// const {AppHome} = require('../../blocks');
const {show_untriaged_cards} = require('../commonFunctions');

module.exports = app => {
  app.action('main_level_filter_selection', async ({ack, body, context, client}) => {
    await ack();
    try {
      const action_body = body.actions[0];

      const {selected_option} = action_body;

      const selected_main_level_view = selected_option.text.text;

      console.log('selected_main_level_view', selected_main_level_view);

      // If the selection is All untriaged, then just show those cards
      if (selected_main_level_view === 'All') {
        show_untriaged_cards({
          body,
          context,
          client,
          selected_main_level_view,
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
