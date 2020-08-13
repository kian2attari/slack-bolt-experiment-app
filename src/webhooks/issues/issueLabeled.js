const {query, mutation, graphql} = require('../../graphql');
const {getTeamOrgLevelProjectBoard} = require('../../models');
const {
  regExp: {findTriageLabels},
} = require('../../constants');

async function issueLabeled(req, res) {
  const installationId = req.installation.id;

  // const {node_id: repo_id} = req.repository;

  const issueNodeId = req.issue.node_id;

  const currentIssueLabelsArray = req.issue.labels;
  console.log(': ----------------------------------------------------------------');
  console.log('issueLabeled -> currentIssueLabelsArray', currentIssueLabelsArray);
  console.log(': ----------------------------------------------------------------');

  // Checking to see if the issue already has a triage label.
  const currentTriageLabel = currentIssueLabelsArray.filter(issue =>
    findTriageLabels.test(issue.description)
  );

  console.log(': ------------------------------------------------------');
  console.log('issueLabeled -> currentTriageLabel', currentTriageLabel);
  console.log(': ------------------------------------------------------');

  // An issue/PR can never have more than 1 triage label
  if (currentTriageLabel.length > 1) {
    // TODO message the team to let them know of this
    console.log('Issue contains multiple triage labels');
    res.send();
    return;
  }

  const {name: labelName, description: labelDescription} = req.label;

  const {
    projectId: orgLevelProjectBoardId,
    projectColumns,
  } = await getTeamOrgLevelProjectBoard(installationId);

  const isTriageLabel = findTriageLabels.test(labelDescription);

  if (labelName === 'Untriaged') {
    console.log(
      'project board id array',
      [orgLevelProjectBoardId],
      orgLevelProjectBoardId
    );
    const variablesAssignIssueToProject = {
      issueId: issueNodeId,
      projectIds: [orgLevelProjectBoardId],
    };

    // REVIEW should i return the promise up to webhookEvents.js rather than awaiting it here and returning nothing?
    await graphql.callGhGraphql(
      mutation.assignIssueToProject,
      variablesAssignIssueToProject,
      installationId
    );

    res.send();

    return;
  }

  if (isTriageLabel) {
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
    switch (labelName) {
      case 'Question': {
        const variablesMoveProjectCard = {
          cardId: issueCard.id,
          columnId: projectColumns.Question.id,
        };
        await graphql.callGhGraphql(
          mutation.moveProjectCard,
          variablesMoveProjectCard,
          installationId
        );
        break;
      }

      case 'Discussion': {
        const variablesMoveProjectCard = {
          cardId: issueCard.id,
          columnId: projectColumns.Discussion.id,
        };
        await graphql.callGhGraphql(
          mutation.moveProjectCard,
          variablesMoveProjectCard,
          installationId
        );
        break;
      }

      default: {
        const variablesMoveProjectCard = {
          cardId: issueCard.id,
          columnId: projectColumns['To Do'].id,
        };
        await graphql.callGhGraphql(
          mutation.moveProjectCard,
          variablesMoveProjectCard,
          installationId
        );
      }
    }
  }

  // REVIEW maybe we only assign the card to the org-wide repo?

  // Success
  res.send();
}

exports.issueLabeled = issueLabeled;
