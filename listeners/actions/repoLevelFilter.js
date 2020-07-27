const {AppHome} = require('../../blocks');
const {TriageTeamData} = require('../../models');

function project_selection(app, user_app_home_state_obj) {
  app.action('project_selection', async ({ack, body, context, client}) => {
    await ack();

    try {
      const action_body = body.actions[0];

      const {selected_option} = action_body;

      console.log(': --------------------------------');
      console.log('selected_option project_name', selected_option);
      console.log(': --------------------------------');

      const project_name = selected_option.text.text;

      const project_id = selected_option.value;

      user_app_home_state_obj.currently_selected_repo.currently_selected_project.set_project(
        project_name,
        project_id
      );

      console.log(': ------------------------------------------------');
      console.log(
        'user_app_home_state_obj current column',
        user_app_home_state_obj.currently_selected_repo.currently_selected_project
          .currently_selected_column
      );
      console.log(': ------------------------------------------------');

      const home_view = AppHome.BaseAppHome(user_app_home_state_obj);
      // console.log(JSON.stringify(home_view.blocks, null, 4));

      /* view.publish is the method that your app uses to push a view to the Home tab */
      await client.views.update({
        /* retrieves your xoxb token from context */
        token: context.botToken,

        /* View to be updated */
        view_id: body.view.id,

        /* the view payload that appears in the app home */
        view: home_view,
      });
    } catch (error) {
      console.error(error);
    }
  });
}

function column_selection(app, triage_team_data_obj, user_app_home_state_obj) {
  app.action('column_selection', async ({ack, body, context, client}) => {
    // TODO account for deleting
    await ack();

    try {
      const action_body = body.actions[0];

      const {selected_option} = action_body;

      const column_name = selected_option.text.text;

      const column_id = selected_option.value;

      const selected_project =
        user_app_home_state_obj.currently_selected_repo.currently_selected_project;

      selected_project.currently_selected_column.set_column(column_name, column_id);
      // TODO Columns must be a map
      // const cards_in_selected_column = triage_team_data_obj.subscribed_repo_map
      //   .get(user_app_home_state_obj.currently_selected_repo.repo_path)
      //   .repo_project_map.get(
      //     user_app_home_state_obj.currently_selected_repo
      //       .currently_selected_project.project_name
      //   ).columns;

      const cards_in_selected_column = await TriageTeamData.get_cards_by_column(
        column_id
      );

      console.log('cards_in_selected_column', cards_in_selected_column);

      const card_blocks = AppHome.AppHomeIssueCards.triaged_cards(
        cards_in_selected_column
      );
      console.log(': ------------------------');
      console.log('card_blocks');
      console.log(': ------------------------');

      const home_view = AppHome.BaseAppHome(user_app_home_state_obj, card_blocks);

      /* view.publish is the method that your app uses to push a view to the Home tab */
      await client.views.update({
        /* retrieves your xoxb token from context */
        token: context.botToken,

        /* View to be updated */
        view_id: body.view.id,

        // the view payload that appears in the app home
        view: home_view,
      });
    } catch (error) {
      console.error(error);
    }
  });
}

module.exports = {project_selection, column_selection};
