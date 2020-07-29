const {AppHome} = require('../../blocks');
const {show_all_untriaged_cards} = require('../commonFunctions');
const {find_triage_team_by_slack_user} = require('../../db');
/**
 * Listens for the app_home_opened event
 *
 * @param {App} app An instance of the Bolt App
 * @param {Object} triage_team_data_obj
 * @param {Object} user_app_home_state_obj
 * @returns {any} Void
 */
function app_home_opened(
  app,
  triage_team_data_obj,
  user_app_home_state_obj,
  default_selected_repo = {}
) {
  app.event('app_home_opened', async ({event, context, client}) => {
    // Find the team (if there is one) that the current use is a member in.
    // TODO: call function exported from db to find the right triage team
    // EXTRA CREDIT: turn this section of code into a middleware that adds context.triageTeam, then you don't need to
    // write this code more than once.
    console.log('event.user', event.user);

    const team_data = await find_triage_team_by_slack_user(event.user);
    console.log(': --------------------');
    console.log('app_home_opened -> team_data', team_data);
    console.log(': --------------------');

    try {
      // TODO change the issue section of the App Home to display a CTA to make a team
      if (team_data.length === 0) {
        console.log('There is currently no triage team');
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
      // Make sure the team is subscribed to at least one repo
      if (Object.keys(team_data[0].subscribed_repos).size === 0) {
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

exports.app_home_opened = app_home_opened;
