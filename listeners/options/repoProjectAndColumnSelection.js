const {SubBlocks} = require('../../blocks');
// DEPRECATED
function repo_project_options(app, triage_team_data_obj, user_app_home_state_obj) {
  // Responding to a project_selection option with list of projects in a repo
  app.options('project_selection', async ({options, ack}) => {
    try {
      // TODO try using options directly
      console.log('options', options);

      const selected_repo_path = user_app_home_state_obj.get_selected_repo_path();

      const subscribed_repo_projects = triage_team_data_obj.get_team_repo_subscriptions(
        selected_repo_path
      ).repo_project_map;

      if (subscribed_repo_projects.size !== 0) {
        const project_options_block_list = Array.from(
          subscribed_repo_projects.values()
        ).map(project => {
          return SubBlocks.option_obj(project.name, project.id);
        });

        console.log('project_options_block_list', project_options_block_list);

        await ack({
          options: project_options_block_list,
        });
      } else {
        const no_projects_option = SubBlocks.option_obj(
          'No projects found',
          'no_projects'
        );
        // REVIEW should I return the empty option or nothing at all?

        await ack({
          options: no_projects_option,
        });

        // await ack();
      }
    } catch (error) {
      console.error(error);
    }
  });
}

function project_column_options(app, user_app_home_state_obj, triage_team_data_obj) {
  // Responding to a column_selection option with list of columns in a repo
  app.options('column_selection', async ({options, ack}) => {
    try {
      // TODO try using options directly
      console.log(': ----------------');
      console.log('options', options);
      console.log(': ----------------');

      const selected_repo_path =
        user_app_home_state_obj.currently_selected_repo.repo_path;

      const selected_project_name = user_app_home_state_obj.get_selected_project_name();

      console.log(': --------------------------------------------');
      console.log('selected_project_name', selected_project_name);
      console.log(': --------------------------------------------');

      const selected_project_columns = triage_team_data_obj
        .get_team_repo_subscriptions(selected_repo_path)
        .repo_project_map.get(selected_project_name).columns;

      if (
        typeof selected_project_columns !== 'undefined' &&
        selected_project_columns.size !== 0
      ) {
        const column_options_block_list = Array.from(
          selected_project_columns.values()
        ).map(column => {
          return SubBlocks.option_obj(column.name, column.id);
        });

        console.log('column_options_block_list', column_options_block_list);

        await ack({
          options: column_options_block_list,
        });
      } else {
        const no_columns_option = SubBlocks.option_obj('No columns found', 'no_columns');
        console.log('no columns');
        // REVIEW should I return the empty option or nothing at all?

        await ack({
          options: no_columns_option,
        });

        // await ack();
      }
    } catch (error) {
      console.error(error);
    }
  });
}

module.exports = {repo_project_options, project_column_options};
