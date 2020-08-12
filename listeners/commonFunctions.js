const {graphql, query} = require('../graphql');
const {AppHome} = require('../blocks');
const {Modals} = require('../blocks');
const {SafeAccess} = require('../helper-functions');
const {update_document, find_triage_team_by_slack_user} = require('../db');
const {regExp} = require('../constants');
/**
 * Updates the app home page with a list of cards of untriaged issues/PR's depending on the
 * main level scope that was selected (ie. All Untriaged, only internal issues, only
 * external issues, or a specific repo).
 *
 * @param {any} context_data_obj The context and client from the action (ie. button press)
 *     or event (ie. app_home_opened) that would call this function
 * @returns {Promise}
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
    return client.views.open({
      token: context.botToken,
      trigger_id,
      view: Modals.CreateTriageTeamModal,
    });
  }

  if (!repo_project_id) {
    console.log('No subscribed repos or some other issue occurred with the repo');
    // TODO open a modal showing this error
    throw Error('No subscribed repos or some other issue occurred with the repo');
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

  return client.views.publish({
    token: context.botToken,
    user_id,
    view: home_view,
  });
}
/**
 * @param {{body: {}; client: {}; context: {}}} context_data_obj
 * @param {String} selected_button
 * @param {Function} internal_issues_filter_callback_generator Takes in a user_id and
 *     returns a callback function
 * @param {Function} external_card_filter_callback_generator Takes a github_username and
 *     returns a callback function
 * @param {String} project_board_column
 * @param {Boolean} show_only_done
 * @returns {Promise}
 */
async function show_triaged_cards(
  context_data_obj,
  selected_button,
  internal_issues_filter_callback_generator,
  external_card_filter_callback_generator,
  project_board_column,
  show_only_claimed_internal_issues = false,
  show_only_done = false
) {
  const {body, client, context} = context_data_obj;

  const user_id = body.user.id;

  /* Grab the org level project board for the triage team that the user is a part of. 
We only need the project board data so a projection is passed in as the second parameter */

  const response = await find_triage_team_by_slack_user(user_id, {
    org_level_project_board: 1,
    gitwave_github_app_installation_id: 1,
    team_members: 1,
    internal_triage_items: 1,
  });

  const selected_column =
    response[0].org_level_project_board.project_columns[project_board_column];

  const installation_id = response[0].gitwave_github_app_installation_id;

  const user_github_username = response[0].team_members[user_id].github_username;

  const get_cards_by_proj_column_vars = {
    column_id: selected_column.id,
  };

  const cards_response = await graphql.call_gh_graphql(
    query.getCardsByProjColumn,
    get_cards_by_proj_column_vars,
    installation_id
  );

  // We only want the cards that are assigned to this particular user so we gotta thin the stack out a bit

  const filtered_external_cards = cards_response.node.cards.nodes.filter(
    external_card_filter_callback_generator(user_github_username)
  );

  console.log(': ------------------------------------------------------------------');
  console.log('filtered_external_cards', filtered_external_cards);
  console.log(': ------------------------------------------------------------------');

  const filtered_internal_issues = internal_issues_filter_callback_generator // In case a generator wasn't provided
    ? Object.values(response[0].internal_triage_items).filter(
        internal_issues_filter_callback_generator(user_id)
      )
    : [];

  console.log(': ------------------------------------------------------------------');
  console.log('filtered_internal_issues', filtered_internal_issues);
  console.log(': ------------------------------------------------------------------');

  const card_blocks = AppHome.AppHomeIssueCards.triaged_cards(
    filtered_external_cards,
    filtered_internal_issues,
    show_only_claimed_internal_issues,
    show_only_done
  );

  const home_view = AppHome.BaseAppHome('All', card_blocks, selected_button);

  return client.views.publish({
    token: context.botToken,
    user_id,
    view: home_view,
  });
}

/**
 * Updates the triage status of an internal issue. Used whenever a team member reacts to an
 * internal issue message, whether from the App Home or directly on the message.
 *
 * @param {{}} event_metadata
 * @returns {Promise}
 */
async function update_internal_triage_status_in_db(event_metadata) {
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

  const fixed_format_ts = issue_message_ts.replace(regExp.find_all_dots, '_');

  const update_issue_obj = {};

  const update_issue_obj_property = `internal_triage_items.${fixed_format_ts}.issue_triage_data`;

  update_issue_obj[update_issue_obj_property] = issue_triage_data;

  console.log('update issue obj', update_issue_obj);

  return update_document(team_query_filter, update_issue_obj);
}

exports.update_internal_triage_status_in_db = update_internal_triage_status_in_db;
exports.show_untriaged_cards = show_untriaged_cards;
exports.show_triaged_cards = show_triaged_cards;
