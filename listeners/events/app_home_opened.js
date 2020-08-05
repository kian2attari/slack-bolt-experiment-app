const {AppHome} = require('../../blocks');
const {show_untriaged_cards} = require('../commonFunctions');
/**
 * Listens for the app_home_opened event
 *
 * @param {App} app An instance of the Bolt App
 * @param {Object} triage_team_data_obj
 * @param {Object} user_app_home_state_obj
 * @returns {any} Void
 */
function app_home_opened(app) {
  const {TriageTeamData} = require('../../models'); // TODO Fix this function level import. There should be no need
  app.event('app_home_opened', async ({event, context, client}) => {
    // Find the team (if there is one) that the current use is a member in.
    // EXTRA CREDIT: turn this section of code into a middleware that adds context.triageTeam, then you don't need to
    // write this code more than once.

    console.log('event.user', event.user);

    const team_data = await TriageTeamData.get_team_repo_subscriptions(event.user);

    const main_level_filter_selection = {
      name: 'All',
      value: 'All',
    };

    try {
      // TODO change the issue section of the App Home to display a CTA to make a team
      if (typeof team_data === 'undefined') {
        console.log(`${event.user} currently is not associated with a triage team`);
        const home_view = AppHome.BaseAppHome(main_level_filter_selection);
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
      if (Object.keys(team_data.subscribed_repos).size === 0) {
        // TODO change the issue section of the App Home to display a CTA to subscribe to a repo
        console.log('The team is not currently subscribed to any repos');
        const home_view = AppHome.BaseAppHome(main_level_filter_selection);
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

      /* TODO_EXTRA rn the view defaults to All untriaged whenever the app home is opened. If you want the selection scope (ex. only internal) to persist
      after the user leaves the app home page, you can use either the private metadata property or get the previous state of the app home view from the
      app_home_opened event */

      // const selected_main_level_view = {name: 'All', value: 'all'};

      await show_untriaged_cards({
        context,
        client,
        event,
        selected_main_level_view: main_level_filter_selection,
      });
    } catch (error) {
      console.error(error);
    }
  });
}

exports.app_home_opened = app_home_opened;
