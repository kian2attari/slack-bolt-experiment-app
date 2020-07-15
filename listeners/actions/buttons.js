const blocks = require('../../blocks');

/**
 *
 *
 * @param {App} app
 */
function open_map_modal_button(app) {
  app.action('open_map_modal_button', async ({ack, body, context, client}) => {
    // Here we acknowledge receipt
    await ack();

    const {trigger_id} = body;

    await client.views.open({
      token: context.botToken,
      trigger_id,
      view: blocks.UsernameMapModal,
    });
  });
}

function open_set_repo_defaults_modal_button(app) {
  app.action(
    'open_set_repo_defaults_modal_button',
    async ({ack, body, context, client}) => {
      // Here we acknowledge receipt
      await ack();

      // TODO: Check the value of the button, if it specifies a repo then set the repo_path
      const selected_repo = {repo_path: undefined};

      console.log(': ----------');
      console.log('open_map_modal_button context', context);
      console.log(': ----------');

      console.log(': ----------');
      console.log('open_map_modal_button context', context);
      console.log(': ----------');

      const {trigger_id} = body;

      await client.views.open({
        token: context.botToken,
        trigger_id,
        view: blocks.SetupRepoNewIssueDefaultsModal(selected_repo),
      });
    }
  );
}

module.exports = {open_map_modal_button, open_set_repo_defaults_modal_button};
