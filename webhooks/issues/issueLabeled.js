const {mutation, graphql} = require('../../graphql');
const {find_documents} = require('../../db');
// TODO make this async
async function issue_labeled(triage_team_data_obj, app, req, res) {
  console.log(`${req.headers['x-github-event']}.${req.body.action} arrived!`);
  const request = req.body;
  // eslint-disable-next-line no-unused-vars
  const {full_name: repo_path, id: repo_id} = request.repository;

  const issue_node_id = request.issue.node_id;

  const repo_obj = triage_team_data_obj.get_team_repo_subscriptions(repo_path);
  console.log(': ------------------');
  console.log('repo_obj', repo_obj);
  console.log(': ------------------');

  if (typeof repo_obj === 'undefined') {
    console.log(`${repo_path}: Team is not currently subscribed to this repo!`);
    res.send();
    return;
  }

  /* ---- ANCHOR What to do  there is a label added or removed from an issue ---- */
  // const issue_label_array = request.issue.labels;

  const label_id = request.label.node_id;
  const untriaged_label_id = repo_obj.untriaged_settings.untriaged_label.label_id;

  // TODO if the label is question, put it under the question column
  console.log(': ------------------');
  console.log('label_id', label_id);
  console.log(': ------------------');

  console.log(': --------------------------------------------------');
  console.log('untriaged_label id', untriaged_label_id);
  console.log(': --------------------------------------------------');
  /* TODO if the applied label was a triage label, there should not be any other triage label currently applied to it. If there is:
      Message the team to let the know it happened */
  // TODO the app should ignore issues with multiple triage labels
  // REVIEW maybe we only assign the card to the org-wide repo?
  if (label_id === untriaged_label_id) {
    // TODO maybe only one project id is needed
    const variables_assignIssueToProject = {
      issue_id: issue_node_id,
      project_ids: [triage_team_data_obj.get_default_untriaged_project().project_id],
    };

    // TODO: Create a card in the org-wide repo to indicate the presence of this untriaged issue
    // Assigns the project to the selected issue
    try {
      const db_repo_filter = {};

      db_repo_filter[`subscribed_repos.${repo_path}`] = {$exists: true};
      // TODO Add org_level_project_board to DB
      const db_query = await find_documents(db_repo_filter, {
        gitwave_github_app_installation_id: 1,
      });

      const installation_id = db_query[0].gitwave_github_app_installation_id;

      const assignIssueToProjectMutation = await graphql.call_gh_graphql(
        mutation.assignIssueToProject,
        variables_assignIssueToProject,
        installation_id
      );

      console.log('assignIssueToProjectMutation', assignIssueToProjectMutation);
    } catch (error) {
      console.error(error);
    }
  }
  // Success
  res.send();
}

exports.issue_labeled = issue_labeled;
