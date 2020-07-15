function repo_selection(app, user_subscribed_repos_obj) {
  app.options('repo_selection', async ({options, ack}) => {
    try {
      // TODO try using options directly
      console.log('repo_selection options', options);

      const subscribed_repos = user_subscribed_repos_obj.subscribed_repo_map;

      console.log('subscribed_repos', subscribed_repos);

      if (subscribed_repos.size !== 0) {
        // const repo_options_block_list = Array.from(subscribed_repos.keys(), repo => {
        //   return option_obj(repo);
        // });
        const repo_options_block_list = [
          option_obj('All Untriaged', 'all_untriaged'),
          ...Array.from(subscribed_repos.keys()).map(repo => {
            return option_obj(repo);
          }),
        ];

        console.log('repo_options_block_list', repo_options_block_list);

        await ack({
          options: repo_options_block_list,
        });
      } else {
        const no_subscribed_repos_option = option_obj(
          'No repo subscriptions found',
          'no_subscribed_repos'
        );
        // REVIEW should I return the empty option or nothing at all?
        await ack({
          options: no_subscribed_repos_option,
        });

        // await ack();
      }
    } catch (error) {
      console.error(error);
    }
  });
}

module.exports = {repo_selection};
