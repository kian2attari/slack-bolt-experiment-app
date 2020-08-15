const {query, mutation, graphql} = require('../../graphql');
const {getTeamOrgAndRepoLevelProjectBoards} = require('../../models');
const {
  regExp: {findTriageLabels},
} = require('../../constants');

async function issueLabeled(req, res) {
  const installationId = req.installation.id;

  const {full_name: repoFullName} = req.repository;

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
    orgLevelProjectBoard: {
      projectId: orgLevelProjectBoardId,
      projectColumns: orgLevelProjectColumns,
    },
    repoLevelProjectBoard: {
      id: repoLevelProjectBoardId,
      columns: repoLevelProjectColumns,
    },
  } = await getTeamOrgAndRepoLevelProjectBoards(repoFullName, installationId); // TODO Get both org and repo project boards

  const isTriageLabel = findTriageLabels.test(labelDescription);

  if (labelName === 'Untriaged') {
    console.log('project board id array', [
      orgLevelProjectBoardId,
      repoLevelProjectBoardId,
    ]);
    const variablesAssignIssueToProject = {
      issueId: issueNodeId,
      projectIds: [orgLevelProjectBoardId, repoLevelProjectBoardId],
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
      projectIds: [orgLevelProjectBoardId, repoLevelProjectBoardId],
    };

    const projectCardsResponse = await graphql.callGhGraphql(
      query.getAllUntriaged,
      variablesGetAllUntriaged,
      installationId
    );

    const issueCards = projectCardsResponse.nodes.map(project =>
      project.pendingCards.nodes.find(card => card.content.id === issueNodeId)
    );

    console.log('issueCards', issueCards);
    switch (labelName) {
      case 'Question': {
        // We move the card for the issue/PR to the appropriate column in both the repo level board and the org level board
        await Promise.all([
          graphql.callGhGraphql(
            mutation.moveProjectCard,
            {
              cardId: issueCards[0].id,
              columnId: orgLevelProjectColumns.Question.id,
            },
            installationId
          ),
          graphql.callGhGraphql(
            mutation.moveProjectCard,
            {
              cardId: issueCards[1].id,
              columnId: repoLevelProjectColumns.Question.id,
            },
            installationId
          ),
        ]);
        break;
      }

      case 'Discussion': {
        await Promise.all([
          graphql.callGhGraphql(
            mutation.moveProjectCard,
            {
              cardId: issueCards[0].id,
              columnId: orgLevelProjectColumns.Discussion.id,
            },
            installationId
          ),
          graphql.callGhGraphql(
            mutation.moveProjectCard,
            {
              cardId: issueCards[1].id,
              columnId: repoLevelProjectColumns.Discussion.id,
            },
            installationId
          ),
        ]);

        break;
      }

      default: {
        await Promise.all([
          graphql.callGhGraphql(
            mutation.moveProjectCard,
            {
              cardId: issueCards[0].id,
              columnId: orgLevelProjectColumns['To Do'].id,
            },
            installationId
          ),
          graphql.callGhGraphql(
            mutation.moveProjectCard,
            {
              cardId: issueCards[1].id,
              columnId: repoLevelProjectColumns['To Do'].id,
            },
            installationId
          ),
        ]);
      }
    }
  }

  // REVIEW maybe we only assign the card to the org-wide repo?

  // Success
  res.send();
}

exports.issueLabeled = issueLabeled;
