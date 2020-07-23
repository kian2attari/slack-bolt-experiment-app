const {graphql, query} = require('../graphql');
const {AppHome} = require('../blocks');
const {Modals} = require('../blocks');
const {SafeAccess} = require('../helper-functions');

async function show_all_untriaged_cards(context_data_obj) {
  const {
    triage_team_data_obj,
    user_app_home_state_obj,
    context,
    client,
  } = context_data_obj;

  console.log('context_data_obj', context_data_obj);

  const repo_path = 'kian-org/gitwave-test';

  // TODO GET ALL EXTERNAL UNTRIAGED ISSUES FROM ORG PROJECT BOARD
  const repo_project_id = SafeAccess(
    () => triage_team_data_obj.get_default_untriaged_project().project_id
  );

  const trigger_id = SafeAccess(() => context_data_obj.body.trigger_id);

  // Grab the user id depending on whether the thing that called the function as an event or an action
  const user_id =
    SafeAccess(() => context_data_obj.event.user) ||
    SafeAccess(() => context_data_obj.body.user.id);

  /* A default project hasn't been set, open the modal. This is only if the trigger ID exists 
     was given because that indicated it was the result of an action not an event */
  if (typeof repo_project_id === 'undefined' && trigger_id !== null) {
    console.log("A default untriaged project hasn't been set, opening the setup modal");
    await client.views.open({
      token: context.botToken,
      trigger_id,
      // TODO select the repo by default
      view: Modals.SetupRepoNewIssueDefaultsModal(repo_path),
    });
    return;
  }

  if (repo_project_id === null) {
    console.log('No subscribed repos or some other issue occurred with the repo');
    // TODO open a modal showing this error
    return;
  }

  console.log('repo_project_id', repo_project_id);
  // TODO update method
  // Show all untriaged issues from all repos
  const github_untriaged_cards_response = await graphql.call_gh_graphql(
    query.getAllUntriaged,
    {project_ids: [repo_project_id]}
  );
  console.log(': ----------------------------------');
  console.log('github_untriaged_cards_response', github_untriaged_cards_response);
  console.log(': ----------------------------------');
  const untriaged_issues = github_untriaged_cards_response.nodes[0].pendingCards.nodes;

  const untriaged_blocks = AppHome.CardsAppHome(untriaged_issues);

  const home_view = AppHome.BaseAppHome(user_app_home_state_obj, untriaged_blocks);

  console.log(JSON.stringify(home_view, null, 4));

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
