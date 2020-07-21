const {AppHome} = require('../../blocks');
const {show_all_untriaged_cards} = require('../commonFunctions');
/**
 * Listens for the app_home_opened event
 *
 * @param {App} app - An instance of the Bolt App
 * @param {Object} triage_team_data_obj
 * @param {Object} user_app_home_state_obj
 *
 * @returns void
 */
function app_home_opened(
  app,
  triage_team_data_obj,
  user_app_home_state_obj,
  default_selected_repo = {}
) {
  app.event('app_home_opened', async ({event, context, client}) => {
    try {
      console.log('triage_team_data_obj: ', triage_team_data_obj);

      // TODO change the issue section of the App Home to display a CTA to make a team
      if (triage_team_data_obj.team_channel_id.length === 0) {
        console.log('There is currently no triage team');
        console.log('app_home_opened user_app_home_state_obj', user_app_home_state_obj);
        const home_view = AppHome.BaseAppHome(user_app_home_state_obj);
        await client.views.publish({
          /* retrieves your xoxb token from context */
          token: context.botToken,
  
          /* the user that opened your app's app home */
          user_id: event.user,
  
          /* the view payload that appears in the app home */
          view: home_view,
        });
        return;
      }

      if (triage_team_data_obj.get_team_repo_subscriptions().size === 0) {
        // TODO change the issue section of the App Home to display a CTA to subscribe to a repo
        console.log('The team is not currently subscribed to any repos');
        console.log('app_home_opened user_app_home_state_obj', user_app_home_state_obj);
        const home_view = AppHome.BaseAppHome(user_app_home_state_obj);
        await client.views.publish({
          /* retrieves your xoxb token from context */
          token: context.botToken,

          /* the user that opened your app's app home */
          user_id: event.user,

          /* the view payload that appears in the app home */
          view: home_view,
        });
        return;
      }

      const selected_repo_path = user_app_home_state_obj.get_selected_repo_path();

      if (selected_repo_path === default_selected_repo.repo_path) {
        show_all_untriaged_cards({
          triage_team_data_obj,
          user_app_home_state_obj,
          context,
          client,
          event,
        });
      }
    } catch (error) {
      console.error(error);
    }
  });
}

module.exports = {app_home_opened};
