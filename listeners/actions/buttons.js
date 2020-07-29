const {Modals, AppHome} = require('../../blocks');
const {show_all_untriaged_cards} = require('../commonFunctions');
const {find_triage_team_by_slack_user} = require('../../db');
const {graphql, query} = require('../../graphql');

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

    const user_id = body.user.id;

    /* Grab the org level project board for the triage team that the user is a part of. 
    We only need the project board data so a projection is passed in as the second parameter */
    try {
      const response = await find_triage_team_by_slack_user(user_id, {
        org_level_project_board: 1,
        gitwave_github_app_installation_id: 1,
      });

      const to_do_column = response[0].org_level_project_board['To Do'];

      const installation_id = response[0].gitwave_github_app_installation_id;

      const get_cards_by_proj_column_vars = {
        column_id: to_do_column.id,
      };

      const cards_response = await graphql.call_gh_graphql(
        query.getCardsByProjColumn,
        get_cards_by_proj_column_vars,
        installation_id
      );

      console.log(
        ': -------------------------------------------------------------------------'
      );
      console.log(
        'function show_up_for_grabs_filter_button -> cards_response',
        cards_response
      );
      console.log(
        ': -------------------------------------------------------------------------'
      );

      const card_blocks = AppHome.AppHomeIssueCards.triaged_cards(
        cards_response.node.cards.nodes
      );

      console.log(
        ': -------------------------------------------------------------------'
      );
      console.log('functionshow_up_for_grabs_filter_button -> card_blocks', card_blocks);
      console.log(
        ': -------------------------------------------------------------------'
      );

      const home_view = AppHome.BaseAppHome(
        {
          currently_selected_repo: {
            repo_path: 'All Untriaged',
            repo_id: 'all_untriaged',
          },
        },
        card_blocks
      );

      console.log(': ----------');
      console.log('open_map_modal_button context', context);
      console.log(': ----------');

      await client.views.publish({
        token: context.botToken,
        user_id,
        view: home_view,
      });
    } catch (error) {
      console.error(error);
    }

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
  show_up_for_grabs_filter_button,
};
