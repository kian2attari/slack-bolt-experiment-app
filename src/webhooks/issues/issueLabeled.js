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
    repoLevelProjectBoard,
  } = await getTeamOrgAndRepoLevelProjectBoards(repoFullName, installationId); // TODO Get both org and repo project boards

  const {id: repoLevelProjectBoardId, columns: repoLevelProjectColumns} =
    repoLevelProjectBoard || {}; // If the repoLevelProjectBoard does not exist, this will prevent a typeError

  const isTriageLabel = findTriageLabels.test(labelDescription);

  const validProjectIds = [orgLevelProjectBoardId, repoLevelProjectBoardId];

  const projectColumnsArray = [orgLevelProjectColumns, repoLevelProjectColumns];

  // This means the repo doesn't have a valid repo-level project. In this case, we'd only want to move the cards around on the org-level project board
  if (
    typeof repoLevelProjectBoardId === 'undefined' ||
    typeof repoLevelProjectColumns === 'undefined'
  ) {
    validProjectIds.pop();
    projectColumnsArray.pop();
    // TODO message the team to tell them that they need to create a repo level project with the expected columns for the above repo
  }
  if (labelName === 'untriaged') {
    console.log('project board id array', validProjectIds);
    const variablesAssignIssueToProject = {
      issueId: issueNodeId,
      projectIds: validProjectIds,
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
      projectIds: validProjectIds,
    };

    const projectCardsResponse = await graphql.callGhGraphql(
      query.getAllUntriaged,
      variablesGetAllUntriaged,
      installationId
    );

    const filteredIssueCards = projectCardsResponse.nodes
      .map(
        project =>
          project.pendingCards.nodes.find(card => card.content.id === issueNodeId) // We find the card in each project board that map to the issue/PR that just got labeled
      )
      .filter(card => typeof card !== 'undefined'); // In the case that the card exists in the org level board but not the repo level board

    // TODO rather than just moving the card only in the org-level project if the card doesn't exist in the repo-level project, we could create a card for the issue in the repo-level project here

    const projectColumnGraphqlMutationPromises = columnName =>
      projectColumnsArray.map((projectColumnsObj, index) =>
        filteredIssueCards[index] // If that project has the card then we make the call
          ? graphql.callGhGraphql(
              mutation.moveProjectCard,
              {
                cardId: filteredIssueCards[index].id,
                columnId: projectColumnsObj[columnName].id,
              },
              installationId
            )
          : undefined
      );

    console.log('filteredIssueCards', filteredIssueCards);
    switch (labelName) {
      case 'question': {
        // We move the card for the issue/PR to the appropriate column in both the repo level board and the org level board
        await Promise.all(projectColumnGraphqlMutationPromises('Question'));
        break;
      }

      case 'discussion': {
        await Promise.all(projectColumnGraphqlMutationPromises('Discussion'));
        break;
      }

      default: {
        await Promise.all(projectColumnGraphqlMutationPromises('To Do'));
      }
    }
  }

  // REVIEW maybe we only assign the card to the org-wide repo?

  // Success
  res.send();
}

exports.issueLabeled = issueLabeled;
