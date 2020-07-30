const {mutation, graphql} = require('../../graphql');
const {TriageTeamData} = require('../../models');
// TODO get rid of triage_team_data_obj
async function issue_labeled(req, res) {
  const request = req.body;
  const installation_id = request.installation.id;

  // eslint-disable-next-line no-unused-vars
  // const {node_id: repo_id} = request.repository;

  const issue_node_id = request.issue.node_id;

  /* ---- ANCHOR What to do  there is a label added or removed from an issue ---- */
  // const issue_label_array = request.issue.labels;

  const label_name = request.label.name;

  const {
    project_id: org_level_project_board_id,
  } = await TriageTeamData.get_team_org_level_project_board(installation_id);

  // TODO if the label is question, put it under the question column

  /* TODO if the applied label was a triage label, there should not be any other triage label currently applied to it. If there is:
      Message the team to let the know it happened */
  // TODO the app should ignore issues with multiple triage labels
  // REVIEW maybe we only assign the card to the org-wide repo?
  if (label_name === 'Untriaged') {
    // TODO The two project ID's should be the repo level project and the org-level project
    const variables_assignIssueToProject = {
      issue_id: issue_node_id,
      project_ids: [org_level_project_board_id],
    };

    // TODO: Create a card in the org-wide repo to indicate the presence of this untriaged issue
    // Assigns the project to the selected issue
    try {
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
