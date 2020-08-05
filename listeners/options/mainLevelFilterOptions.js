const {SubBlocks} = require('../../blocks');
const {TriageTeamData} = require('../../models');
/* Deprecated! */
module.exports = app => {
  app.options('main_level_filter_selection', async ({options, ack}) => {
    try {
      const {subscribed_repos} = await TriageTeamData.get_team_repo_subscriptions(
        options.user.id
      );

      console.log('subscribed_repos', subscribed_repos);

      if (subscribed_repos.size !== 0) {
        // const repo_options_block_list = Array.from(subscribed_repos.keys(), repo => {
        //   return SubBlocks.option_obj(repo);
        // });
        const repo_options_block_list = [
          SubBlocks.option_obj('All', 'all'),
          ...Object.keys(subscribed_repos).map(repo_path => {
            return SubBlocks.option_obj(repo_path);
          }),
        ];

        console.log('repo_options_block_list', repo_options_block_list);

        await ack({
          options: repo_options_block_list,
        });
      } else {
        const no_subscribed_repos_option = SubBlocks.option_obj(
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
};
