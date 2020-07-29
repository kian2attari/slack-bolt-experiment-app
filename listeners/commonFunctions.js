const {graphql, query} = require('../graphql');
const {AppHome} = require('../blocks');
const {Modals} = require('../blocks');
const {SafeAccess} = require('../helper-functions');
const {find_documents} = require('../db');

async function show_all_untriaged_cards(context_data_obj) {
  const {user_app_home_state_obj, context, client} = context_data_obj;

  console.log(': ----------------------------------------------------------------------');
  console.log('function show_all_untriaged_cards -> context_data_obj', context_data_obj);
  console.log(': ----------------------------------------------------------------------');

  // Grab the user id depending on whether the thing that called the function as an event or an action
  const user_id =
    SafeAccess(() => context_data_obj.event.user) ||
    SafeAccess(() => context_data_obj.body.user.id);

  // TODO potentially move this get installation ID query to its own function
  const db_user_filter = {};

  db_user_filter[`team_members.${user_id}`] = {$exists: true};
  // TODO Add org_level_project_board to DB
  const db_query = await find_documents(db_user_filter, {
    gitwave_github_app_installation_id: 1,
    org_level_project_board: 1,
  });

  const installation_id = db_query[0].gitwave_github_app_installation_id;
  const repo_project_id = db_query.org_level_project_board.project_id;

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

  // TODO update method
  // Show all untriaged issues from all repos
  const github_untriaged_cards_response = await graphql.call_gh_graphql(
    query.getAllUntriaged,
    {project_ids: [repo_project_id]},
    installation_id
  );

  const untriaged_issues = github_untriaged_cards_response.nodes[0].pendingCards.nodes;

  const untriaged_blocks = AppHome.AppHomeIssueCards.untriaged_cards(untriaged_issues);

  const home_view = AppHome.BaseAppHome(user_app_home_state_obj, untriaged_blocks);

  console.log(': ----------');
  console.log('open_map_modal_button context', context);
  console.log(': ----------');

  await client.views.publish({
    token: context.botToken,
    user_id,
    view: home_view,
  });
}

module.exports = {show_all_untriaged_cards};
