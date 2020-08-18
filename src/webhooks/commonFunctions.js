const {getTeamOrgAndRepoLevelProjectBoards} = require('../models');
const {mutation, graphql} = require('../graphql');
const {
  regExp: {findTriageLabels},
} = require('../constants');

async function findValidProjectIds(
  installationId,
  repoFullName,
  currentAssignedLabelsArray
) {
  console.log(': ----------------------------------------------------------------');
  console.log('issueLabeled -> currentAssignedLabelsArray', currentAssignedLabelsArray);
  console.log(': ----------------------------------------------------------------');

  // Checking to see if the issue already has a triage label.
  const currentTriageLabel = currentAssignedLabelsArray.filter(issue =>
    findTriageLabels.test(issue.description)
  );

  console.log(': ------------------------------------------------------');
  console.log('issueLabeled -> currentTriageLabel', currentTriageLabel);
  console.log(': ------------------------------------------------------');

  // An issue/PR can never have more than 1 triage label
  if (currentTriageLabel.length > 1) {
    // TODO message the team to let them know of this
    throw Error('Issue contains multiple triage labels');
  }

  const {
    orgLevelProjectBoard: {
      projectId: orgLevelProjectBoardId,
      projectColumns: orgLevelProjectColumns,
    },
    repoLevelProjectBoard,
  } = await getTeamOrgAndRepoLevelProjectBoards(repoFullName, installationId);

  const {id: repoLevelProjectBoardId, columns: repoLevelProjectColumns} =
    repoLevelProjectBoard || {}; // If the repoLevelProjectBoard does not exist, this will prevent a typeError

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

  return {
    validProjectIds,
    projectColumnsArray,
  };
}

function projectColumnGraphqlMutationPromiseGenerator(
  projectColumnsArray,
  issueCards,
  installationId
) {
  return newColumnName =>
    projectColumnsArray.map((projectColumnsObj, index) =>
      issueCards[index] // If that project has the card then we make the call
        ? graphql.callGhGraphql(
            mutation.moveProjectCard,
            {
              cardId: issueCards[index].id,
              columnId: projectColumnsObj[newColumnName].id,
            },
            installationId
          )
        : undefined
    );
}

exports.findValidProjectIds = findValidProjectIds;
exports.projectColumnGraphqlMutationPromiseGenerator = projectColumnGraphqlMutationPromiseGenerator;
