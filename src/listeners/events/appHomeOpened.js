const {AppHome} = require('../../blocks');
const {showUntriagedCards} = require('../commonFunctions');
const {getTeamRepoSubscriptions} = require('../../models');
/**
 * Listens for the app_home_opened event
 *
 * @param {App} app An instance of the Bolt App
 * @returns {any} Void
 */
function appHomeOpened(app) {
  app.event('app_home_opened', async ({event, context, client}) => {
    // Find the team (if there is one) that the current use is a member in.
    // EXTRA CREDIT: turn this section of code into a middleware that adds context.triageTeam, then you don't need to
    // write this code more than once.
    // TODO turn the code below into its own function so that the app home can be refreshed by actions and not just the app home opened event (ex. after a modal submission)

    console.log('event.user', event.user);

    const teamData = await getTeamRepoSubscriptions(event.user);

    try {
      if (typeof teamData === 'undefined') {
        console.log(`${event.user} currently is not associated with a triage team`);
        // TODO: CTA To make a team!
        const homeView = AppHome.BaseAppHome('NoTeam');
        await client.views.publish({
          /* retrieves your xoxb token from context */
          token: context.botToken,

          /* the user that opened your app's app home */
          'user_id': event.user,

          /* the view payload that appears in the app home */
          view: homeView,
        });
        return;
      }
      // Make sure the team is subscribed to at least one repo
      if (Object.keys(teamData.subscribedRepos).size === 0) {
        // TODO change the issue section of the App Home to display a CTA to subscribe to a repo
        console.log('The team is not currently subscribed to any repos');
        const homeView = AppHome.BaseAppHome('All');
        await client.views.publish({
          /* retrieves your xoxb token from context */
          token: context.botToken,

          /* the user that opened your app's app home */
          'user_id': event.user,

          /* the view payload that appears in the app home */
          view: homeView,
        });
        return;
      }

      /* TODO_EXTRA rn the view defaults to All untriaged whenever the app home is opened. If you want the selection scope (ex. only internal) to persist
      after the user leaves the app home page, you can use either the private metadata property or get the previous state of the app home view from the
      app_home_opened event */

      // const selected_main_level_view = {name: 'All', value: 'all'};

      await showUntriagedCards({
        context,
        client,
        event,
        selectedMainLevelView: 'All',
      });
    } catch (error) {
      console.error(error);
    }
  });
}

exports.appHomeOpened = appHomeOpened;
