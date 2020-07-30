const {Modals, AppHome} = require('../../blocks');
const {show_all_untriaged_cards} = require('../commonFunctions');
const {find_triage_team_by_slack_user, find_documents} = require('../../db');
const {graphql, query, mutation} = require('../../graphql');
const {TriageTeamData} = require('../../models');
const {add_labels_to_card} = require('../../models/TriageTeamData');

/** @param {App} app */
async function open_map_modal_button(app) {
  app.action('open_map_modal_button', async ({ack, body, context, client}) => {
    // Here we acknowledge receipt
    await ack();

    const {trigger_id} = body;

    const user_slack_id = body.user.id;

    const user_set_github_username = await TriageTeamData.get_user_github_username(
      user_slack_id
    );

    console.log(
      'open_map_modal_button user_set_github_username',
      user_set_github_username
    );

    // User has set a github username
    if (user_set_github_username === null) {
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
// OLD and should be removed
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
// All the cards in the To Do column that have been triaged but not assigned
function show_up_for_grabs_filter_button(app) {
  app.action('show_up_for_grabs_filter_button', async ({ack, body, context, client}) => {
    await ack();

    const user_id = body.user.id;

    /* Grab the org level project board for the triage team that the user is a part of. 
    We only need the project board data so a projection is passed in as the second parameter */
    // TODO potentially make this whole grabbing cards by column thing into its own subfunciton
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

      const card_blocks = AppHome.AppHomeIssueCards.triaged_cards(
        cards_response.node.cards.nodes
      );

      const home_view = AppHome.BaseAppHome(
        {
          currently_selected_repo: {
            repo_path: 'All Untriaged',
            repo_id: 'all_untriaged',
          },
        },
        card_blocks,
        'show_up_for_grabs_filter_button'
      );

      await client.views.publish({
        token: context.botToken,
        user_id,
        view: home_view,
      });
    } catch (error) {
      console.error(error);
    }
  });
}
// All cards in the In Progress Column that are assigned to the user
function show_assigned_to_user_filter_button(app) {
  app.action(
    'show_assigned_to_user_filter_button',
    async ({ack, body, context, client}) => {
      await ack();

      const user_id = body.user.id;

      /* Grab the org level project board for the triage team that the user is a part of. 
    We only need the project board data so a projection is passed in as the second parameter */
      try {
        const response = await find_triage_team_by_slack_user(user_id, {
          org_level_project_board: 1,
          gitwave_github_app_installation_id: 1,
          team_members: 1,
        });

        const user_github_username = response[0].team_members[user_id];

        console.log(
          ': -----------------------------------------------------------------------------------------'
        );
        console.log(
          'function show_assigned_to_user_filter_button -> user_github_username',
          user_github_username
        );
        console.log(
          ': -----------------------------------------------------------------------------------------'
        );

        const in_progress_column = response[0].org_level_project_board['In Progress'];

        const installation_id = response[0].gitwave_github_app_installation_id;

        const get_cards_by_proj_column_vars = {
          column_id: in_progress_column.id,
        };

        const cards_response = await graphql.call_gh_graphql(
          query.getCardsByProjColumn,
          get_cards_by_proj_column_vars,
          installation_id
        );

        // We only want the cards that are assigned to this particular user so we gotta thin the stack out a bit
        // TODO extract this filtering function into AppHomeIssueCards as its own cateogry (filtered_cards)
        const filtered_cards_response = cards_response.node.cards.nodes.filter(card =>
          card.content.assignees.nodes.some(user => user.login === user_github_username)
        );

        const card_blocks = AppHome.AppHomeIssueCards.triaged_cards(
          filtered_cards_response
        );

        const home_view = AppHome.BaseAppHome(
          {
            currently_selected_repo: {
              repo_path: 'All Untriaged',
              repo_id: 'all_untriaged',
            },
          },
          card_blocks,
          'show_assigned_to_user_filter_button'
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
    }
  );
}

// TODO theres a lot in common with the top function so the commonalities can def be abstracted into a separate function
// All cards in the Done Column that are assigned to the user
function show_done_by_user_filter_button(app) {
  app.action('show_done_by_user_filter_button', async ({ack, body, context, client}) => {
    await ack();

    const user_id = body.user.id;

    /* Grab the org level project board for the triage team that the user is a part of. 
    We only need the project board data so a projection is passed in as the second parameter */
    try {
      const response = await find_triage_team_by_slack_user(user_id, {
        org_level_project_board: 1,
        gitwave_github_app_installation_id: 1,
        team_members: 1,
      });

      const user_github_username = response[0].team_members[user_id];

      console.log(
        ': -----------------------------------------------------------------------------------------'
      );
      console.log(
        'function show_assigned_to_user_filter_button -> user_github_username',
        user_github_username
      );
      console.log(
        ': -----------------------------------------------------------------------------------------'
      );

      const done_column = response[0].org_level_project_board.Done;

      const installation_id = response[0].gitwave_github_app_installation_id;

      const get_cards_by_proj_column_vars = {
        column_id: done_column.id,
      };

      const cards_response = await graphql.call_gh_graphql(
        query.getCardsByProjColumn,
        get_cards_by_proj_column_vars,
        installation_id
      );

      // We only want the cards that are assigned to this particular user so we gotta thin the stack out a bit
      // We also want to make sure that anything in this column is closed
      // TODO extract this filtering function into AppHomeIssueCards as its own cateogry (filtered_cards)
      const filtered_cards_response = cards_response.node.cards.nodes.filter(
        card =>
          card.content.assignees.nodes.some(
            user => user.login === user_github_username
          ) && card.content.closed
      );

      const card_blocks = AppHome.AppHomeIssueCards.triaged_cards(
        filtered_cards_response
      );

      const home_view = AppHome.BaseAppHome(
        {
          currently_selected_repo: {
            repo_path: 'All Untriaged',
            repo_id: 'all_untriaged',
          },
        },
        card_blocks,
        'show_done_by_user_filter_button'
      );

      await client.views.publish({
        token: context.botToken,
        user_id,
        view: home_view,
      });
    } catch (error) {
      console.error(error);
    }
  });
}

function app_home_triage_buttons(app) {
  const triage_buttons = [
    'assign_bug_label',
    'assign_tests_label',
    'assign_discussion_label',
    'assign_docs_label',
    'assign_enhancement_label',
    'assign_question_label',
  ];

  triage_buttons.forEach(button =>
    app.action(button, async ({ack, body}) => {
      await ack();

      await add_labels_to_card(body.user.id, JSON.parse(body.actions[0].value));
    })
  );
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
  show_assigned_to_user_filter_button,
  show_done_by_user_filter_button,
  app_home_triage_buttons,
};
