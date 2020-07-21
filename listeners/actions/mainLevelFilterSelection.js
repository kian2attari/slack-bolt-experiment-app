const {AppHome} = require('../../blocks');
const common_functions = require('../commonFunctions');

module.exports = (
  app,
  triage_team_data_obj,
  user_app_home_state_obj,
  default_selected_repo
) => {
  app.action('main_level_filter_selection', async ({ack, body, context, client}) => {
    await ack();
    try {
      const action_body = body.actions[0];

      const {selected_option} = action_body;

      const selected_repo_path = selected_option.text.text;

      const selected_repo_id = selected_option.value;

      console.log('selected_repo_path', selected_repo_path);

      console.log('selected_repo_id', selected_repo_id);

      user_app_home_state_obj.set_selected_repo({
        repo_path: selected_repo_path,
        repo_id: selected_repo_id,
      });

      // If the selection is All untriaged, then just show those cards
      if (
        selected_repo_path === default_selected_repo.repo_path &&
        selected_repo_id === default_selected_repo.repo_id
      ) {
        common_functions.show_all_untriaged_cards({
          triage_team_data_obj,
          user_app_home_state_obj,
          body,
          context,
          client,
        });

        return;
      }

      const updated_home_view = AppHome.BaseAppHome(user_app_home_state_obj);
      // QUESTION: should i use views.update or views.publish to update the app home view?
      /* view.publish is the method that your app uses to push a view to the Home tab */
      await client.views.update({
        /* retrieves your xoxb token from context */
        token: context.botToken,

        /* View to be updated */
        view_id: body.view.id,

        /* the view payload that appears in the app home */
        view: updated_home_view,
      });
    } catch (error) {
      console.error(error);
    }
  });
};
