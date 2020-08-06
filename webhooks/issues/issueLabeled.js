const {query, mutation, graphql} = require('../../graphql');
const {get_team_org_level_project_board} = require('../../models');
const {reg_exp} = require('../../constants');

async function issue_labeled(req, res) {
  const request = req.body;
  const installation_id = request.installation.id;

  // eslint-disable-next-line no-unused-vars
  // const {node_id: repo_id} = request.repository;

  const issue_node_id = request.issue.node_id;

  /* ---- ANCHOR What to do  there is a label added or removed from an issue ---- */
  // const issue_label_array = request.issue.labels;

  const {name: label_name, description: label_description} = request.label;

  const {
    project_id: org_level_project_board_id,
    project_columns,
  } = await get_team_org_level_project_board(installation_id);

  // If the label is a triage label
  if (reg_exp.find_triage_labels.test(label_description)) {
    /* TODO if the applied label was a triage label, there should not be any other triage label currently applied to it. If there is:
      Message the team to let the know it happened */
  }

  if (label_name === 'Question') {
    const variables_getAllUntriaged = {
      project_ids: [org_level_project_board_id],
    };

    const project_cards_response = await graphql.call_gh_graphql(
      query.getAllUntriaged,
      variables_getAllUntriaged,
      installation_id
    );

    const issue_card = project_cards_response.nodes[0].pendingCards.nodes.find(
      card => card.content.id === issue_node_id
    );

    const variables_moveProjectCard = {
      card_id: issue_card.id,
      column_id: project_columns.Question.id,
    };
    await graphql.call_gh_graphql(
      mutation.moveProjectCard,
      variables_moveProjectCard,
      installation_id
    );
  } else if (label_name === 'Untriaged') {
    const variables_assignIssueToProject = {
      issue_id: issue_node_id,
      project_ids: [org_level_project_board_id],
    };
    await graphql.call_gh_graphql(
      mutation.assignIssueToProject,
      variables_assignIssueToProject,
      installation_id
    );
  }

  // REVIEW maybe we only assign the card to the org-wide repo?

  // Success
  res.send();
}

exports.issue_labeled = issue_labeled;
