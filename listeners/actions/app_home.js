const blocks = require('../../blocks');
/**
 * Listens for the app_home_opened event
 *
 * @param {App} app - An instance of the Bolt App
 * @param {Object} user_subscribed_repos_obj
 * @param {Object} user_app_home_state_obj
 *
 * @returns void
 */
function app_home_opened(app, user_subscribed_repos_obj, user_app_home_state_obj) {
  app.event('app_home_opened', async ({event, context, client}) => {
    try {
      console.log('user_subscribed_repos_obj: ', user_subscribed_repos_obj);
      /* If a list of initial projects is provided, that must mean that the user has
            either only subscribed to a single repo, or set a default repo. If there's only
            one project, select that by default */

      // TODO optimize this
      if (
        // The user has not selected a repo on the App Home, and they are subscribed to at least one repo
        user_app_home_state_obj.currently_selected_repo.repo_path === '' &&
        user_subscribed_repos_obj.subscribed_repo_map.size !== 0
      ) {
        const default_repo_path = user_subscribed_repos_obj.default_repo;
        // If a default repo hasn't been set, then show all untriaged issues across the repos
        if (default_repo_path === '') {
          user_app_home_state_obj.currently_selected_repo.set_repo(
            'All Untriaged',
            'all_untriaged'
          );
        } else {
          // Set the selected repo to the default repo
          user_app_home_state_obj.currently_selected_repo.set_repo(
            user_subscribed_repos_obj.default_repo,
            user_subscribed_repos_obj.subscribed_repo_map.get(default_repo_path).repo_id
          );
        }
      }

      console.log('app_home_opened user_app_home_state_obj', user_app_home_state_obj);
      // TODO HIGH if default repo is not set, then return app home state object with the selected repo as All Untriaged
      const home_view = blocks.AppHomeBase(user_app_home_state_obj);
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
