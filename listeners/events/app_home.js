const {AppHome} = require('../../blocks');
/**
 * Listens for the app_home_opened event
 *
 * @param {App} app - An instance of the Bolt App
 * @param {Object} triage_team_data_obj
 * @param {Object} user_app_home_state_obj
 *
 * @returns void
 */
function app_home_opened(app, triage_team_data_obj, user_app_home_state_obj) {
  app.event('app_home_opened', async ({event, context, client}) => {
    try {
      console.log('triage_team_data_obj: ', triage_team_data_obj);
      /* If a list of initial projects is provided, that must mean that the user has
            either only subscribed to a single repo, or set a default repo. If there's only
            one project, select that by default */
      // OLD The selection will never be empty with the new code, it will always be All Untriaged at the very least
      // TODO optimize this
      // if (
      //   // The user has not selected a repo on the App Home, and they are subscribed to at least one repo
      //   user_app_home_state_obj.currently_selected_repo.repo_path === '' &&
      //   triage_team_data_obj.get_team_repo_subscriptions().size !== 0
      // ) {
      //   const default_repo_path = user_app_home_state_obj.default_repo;
      //   // If a default repo hasn't been set, then show all untriaged issues across the repos

      //   // Set the selected repo to the default repo
      //   user_app_home_state_obj.selected_repo({
      //     repo_path: triage_team_data_obj.default_repo,
      //     repo_id: triage_team_data_obj.get_team_repo_subscriptions(default_repo_path).repo_id
      //   });
      // }
      // TODO change the issue section of the App Home to display a CTA to make a team
      if (triage_team_data_obj.team_channel_id.length === 0) {
        console.log('There is currently no triage team');
        return;
      }

      // TODO change the issue section of the App Home to display a CTA to subscribe to a repo
      if (triage_team_data_obj.get_team_repo_subscriptions().size === 0) {
        console.log('The team is not currently subscribed to any repos');
        return;
      }

      console.log('app_home_opened user_app_home_state_obj', user_app_home_state_obj);
      // TODO HIGH if default repo is not set, then return app home state object with the selected repo as All Untriaged
      const home_view = AppHome.BaseAppHome(user_app_home_state_obj);
      await client.views.publish({
        /* retrieves your xoxb token from context */
        token: context.botToken,

        /* the user that opened your app's app home */
        user_id: event.user,

        /* the view payload that appears in the app home */
        view: home_view,
      });
    } catch (error) {
      console.error(error);
    }
  });
}

module.exports = {app_home_opened};
