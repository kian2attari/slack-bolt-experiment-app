const {graphql, query} = require('../graphql');
const {AppHome} = require('../blocks');
const {Modals} = require('../blocks');
const {SafeAccess} = require('../helper-functions');
const {update_document, find_triage_team_by_slack_user} = require('../db');
const {reg_exp} = require('../constants');
/**
 * Updates the app home page with a list of cards of untriaged issues/PR's depending on the
 * main level scope that was selected (ie. All Untriaged, only internal issues, only
 * external issues, or a specific repo).
 *
 * @param {any} context_data_obj The context and client from the action (ie. button press)
 *     or event (ie. app_home_opened) that would call this function
 * @returns {Void}
 */
async function show_untriaged_cards(context_data_obj) {
  const {context, client, selected_main_level_view} = context_data_obj;

  // Grab the user id depending on whether the thing that called the function as an event or an action
  const user_id =
    SafeAccess(() => context_data_obj.event.user) ||
    SafeAccess(() => context_data_obj.body.user.id);

  const team_data = await find_triage_team_by_slack_user(user_id, {
    gitwave_github_app_installation_id: 1,
    org_level_project_board: 1,
    internal_triage_items: 1,
    // team_internal_triage_channel_id: 1,
  });

  const {
    internal_triage_items,
    gitwave_github_app_installation_id: installation_id,
    org_level_project_board: {project_id: repo_project_id},
  } = team_data[0];

  const trigger_id = SafeAccess(() => context_data_obj.body.trigger_id);

  /* A default project hasn't been set, open the modal. This is only if the trigger ID exists 
     was given because that indicated it was the result of an action not an event */
  if (typeof repo_project_id === 'undefined' && trigger_id !== null) {
    console.log("A default untriaged project hasn't been set, opening the setup modal");
    await client.views.open({
      token: context.botToken,
      trigger_id,
      view: Modals.CreateTriageTeamModal,
    });
    return;
  }

  if (!repo_project_id) {
    console.log('No subscribed repos or some other issue occurred with the repo');
    // TODO open a modal showing this error
    return;
  }

  // Show all untriaged issues from all repos
  const github_untriaged_cards_response = await graphql.call_gh_graphql(
    query.getAllUntriaged,
    {project_ids: [repo_project_id]},
    installation_id
  );

  const internal_issue_card_array = Object.values(internal_triage_items).filter(
    issues => typeof issues.issue_triage_data === 'undefined'
  );

  console.log('internal_issue_card_array', internal_issue_card_array);

  const external_issue_card_array =
    github_untriaged_cards_response.nodes[0].pendingCards.nodes;

  const untriaged_blocks = AppHome.AppHomeIssueCards.untriaged_cards({
    external_issue_card_array,
    internal_issue_card_array,
  });

  const home_view = AppHome.BaseAppHome(selected_main_level_view, untriaged_blocks);

  await client.views.publish({
    token: context.botToken,
    user_id,
    view: home_view,
  });
}

async function update_internal_triage_status_in_db(event_metadata) {
  try {
    const {user, reaction, event_ts, channel, issue_message_ts} = event_metadata;

    const issue_triage_data = {
      acting_team_member_user_id: user,
      reaction_last_update_ts: event_ts,
      status: 'untriaged',
    };

    switch (reaction) {
      case 'eyes':
        issue_triage_data.status = 'seen';
        break;
      case 'white_check_mark':
        issue_triage_data.status = 'done';
        break;
      // no default
    }

    console.log('issue_triage_data', issue_triage_data);

    const team_query_filter = {
      team_internal_triage_channel_id: channel,
    };

    const fixed_format_ts = issue_message_ts.replace(reg_exp.find_all_dots, '_');

    const update_issue_obj = {};

    const update_issue_obj_property = `internal_triage_items.${fixed_format_ts}.issue_triage_data`;

    update_issue_obj[update_issue_obj_property] = issue_triage_data;

    console.log('update issue obj', update_issue_obj);

    const response = await update_document(team_query_filter, update_issue_obj);

    console.log('success response', response);
  } catch (error) {
    console.error(error);
  }
}

exports.update_internal_triage_status_in_db = update_internal_triage_status_in_db;
exports.show_untriaged_cards = show_untriaged_cards;
