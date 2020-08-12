const {query, mutation, graphql} = require('../../graphql');
const {getTeamOrgLevelProjectBoard} = require('../../models');
const {regExp} = require('../../constants');

async function issueLabeled(req, res) {
  const request = req.body;
  const installationId = request.installation.id;

  // eslint-disable-next-line no-unused-vars
  // const {node_id: repo_id} = request.repository;

  const issueNodeId = request.issue.node_id;

  /* ---- ANCHOR What to do  there is a label added or removed from an issue ---- */
  // const issue_label_array = request.issue.labels;

  const {name: labelName, description: labelDescription} = request.label;

  const {
    project_id: orgLevelProjectBoardId,
    projectColumns,
  } = await getTeamOrgLevelProjectBoard(installationId);

  // If the label is a triage label
  if (regExp.findTriageLabels.test(labelDescription)) {
    /* TODO if the applied label was a triage label, there should not be any other triage label currently applied to it. If there is:
      Message the team to let the know it happened */
  }

  if (labelName === 'Question') {
    const variablesGetAllUntriaged = {
      projectIds: [orgLevelProjectBoardId],
    };

    const projectCardsResponse = await graphql.callGhGraphql(
      query.getAllUntriaged,
      variablesGetAllUntriaged,
      installationId
    );

    const issueCard = projectCardsResponse.nodes[0].pendingCards.nodes.find(
      card => card.content.id === issueNodeId
    );

    const variablesMoveProjectCard = {
      cardId: issueCard.id,
      columnId: projectColumns.Question.id,
    };
    await graphql.callGhGraphql(
      mutation.moveProjectCard,
      variablesMoveProjectCard,
      installationId
    );
  } else if (labelName === 'Untriaged') {
    const variablesAssignIssueToProject = {
      issueId: issueNodeId,
      projectIds: [orgLevelProjectBoardId],
    };
    await graphql.callGhGraphql(
      mutation.assignIssueToProject,
      variablesAssignIssueToProject,
      installationId
    );
  }

  // REVIEW maybe we only assign the card to the org-wide repo?

  // Success
  res.send();
}

exports.issueLabeled = issueLabeled;
