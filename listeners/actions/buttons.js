const {Modals} = require('../../blocks');
const {show_all_untriaged_cards} = require('../commonFunctions');

/** @param {App} app */
function open_map_modal_button(app, team_members_map) {
  app.action('open_map_modal_button', async ({ack, body, context, client}) => {
    // Here we acknowledge receipt
    await ack();

    const {trigger_id} = body;

    const user_slack_id = body.user.id;

    const user_set_github_username = team_members_map.get(user_slack_id);

    console.log(
      'open_map_modal_button user_set_github_username',
      user_set_github_username
    );

    // User has set a github username
    if (user_set_github_username === 'no github username set') {
      await client.views.open({
        token: context.botToken,
        trigger_id,
        view: Modals.UsernameMapModal(),
      });
    } else {
      await client.views.open({
        token: context.botToken,
        trigger_id,
        view: Modals.UsernameMapModal(user_set_github_username),
      });
    }
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
        view: Modals.SetupRepoNewIssueDefaultsModal(selected_repo),
      });
    }
  );
}

function show_untriaged_filter_button(
  app,
  triage_team_data_obj,
  user_app_home_state_obj
) {
  // The app home 'Untriaged' filter button
  app.action('show_untriaged_filter_button', async ({ack, body, context, client}) => {
    // Here we acknowledge receipt
    await ack();

    await show_all_untriaged_cards({
      triage_team_data_obj,
      user_app_home_state_obj,
      body,
      context,
      client,
    });
  });
}

function show_up_for_grabs_filter_button(app) {
  app.action('show_up_for_grabs_filter_button', async ({ack, body, context, client}) => {
    await ack();

    // TODO get all the cards in the TODO column of the org-level project
  });
}

// Acknowledges arbitrary button clicks (ex. open a link in a new tab)
function link_button(app) {
  app.action('link_button', async ({ack}) => ack());
}

module.exports = {
  open_map_modal_button,
  open_set_repo_defaults_modal_button,
  show_untriaged_filter_button,
  link_button,
};
