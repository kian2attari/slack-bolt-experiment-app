const {Modals} = require('../../blocks');

function github_org_select_input(app) {
  app.action('setup_defaults_repo_selection', async ({ack, body, context, client}) => {
    await ack();
    try {
      const action_body = body.actions[0];

      const {selected_option} = action_body;

      const selected_repo_path = selected_option.text.text;

      // const selected_repo_id = selected_option.value;

      console.log('selected_repo_path', selected_repo_path);

      const selected_repo_obj = {
        repo_path: selected_repo_path,
        selected_project_name: undefined,
      };
      const updated_modal = Modals.SetupRepoNewIssueDefaultsModal(selected_repo_obj);

      await client.views.update({
        /* retrieves your xoxb token from context */
        token: context.botToken,

        /* View to be updated */
        view_id: body.view.id,

        /* the view payload that appears in the modal */
        view: updated_modal,
      });
    } catch (error) {
      console.error(error);
    }
  });
}

module.exports = {github_org_select_input};
