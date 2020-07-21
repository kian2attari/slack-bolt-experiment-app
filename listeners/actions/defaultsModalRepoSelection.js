const {Modals} = require('../../blocks');

function modal_repo_selection(app) {
  app.action(
    'setup_defaults_modal_repo_selection',
    async ({ack, body, context, client}) => {
      console.log(': ----------------');
      console.log('setup_defaults_modal_repo_selection context', context);
      console.log(': ----------------');

      console.log(': ----------');
      console.log('setup_defaults_modal_repo_selection body', body);
      console.log(': ----------');

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
    }
  );
}

module.exports = {modal_repo_selection};
