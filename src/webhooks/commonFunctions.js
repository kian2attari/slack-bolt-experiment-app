const {getTeamOrgAndRepoLevelProjectBoards, getRepoUntriagedLabel} = require('../models');
const {query, mutation, graphql} = require('../graphql');
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

async function issueOrPrLabeled(req, res) {
  const installationId = req.installation.id;

  const {full_name: repoFullName} = req.repository;

  const issueOrPr = req.issue || req.pull_request;

  const elementNodeId = issueOrPr.node_id;

  const currentIssueLabelsArray = issueOrPr.labels;

  const {name: labelName, description: labelDescription} = req.label;

  const {validProjectIds, projectColumnsArray} = await findValidProjectIds(
    installationId,
    repoFullName,
    currentIssueLabelsArray
  );

  if (labelName === 'untriaged') {
    console.log('project board id array', validProjectIds);

    const issueOrPrMutation = req.issue
      ? graphql.callGhGraphql(
          mutation.assignIssueToProject,
          {
            issueId: elementNodeId,
            projectIds: validProjectIds,
          },
          installationId
        )
      : graphql.callGhGraphql(
          mutation.assignPullRequestToProject,
          {
            pullRequestId: elementNodeId,
            projectIds: validProjectIds,
          },
          installationId
        );

    await issueOrPrMutation;

    // REVIEW should i return the promise up to webhookEvents.js rather than awaiting it here and returning nothing?

    res.send();
  }

  const isTriageLabel = findTriageLabels.test(labelDescription);

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
          project.pendingCards.nodes.find(card => card.content.id === elementNodeId) // We find the card in each project board that map to the issue/PR that just got labeled
      )
      .filter(card => typeof card !== 'undefined'); // In the case that the card exists in the org level board but not the repo level board

    const projectColumnGraphqlMutationPromises = projectColumnGraphqlMutationPromiseGenerator(
      projectColumnsArray,
      filteredIssueCards,
      installationId
    );
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

async function issueOrPrUnlabeled(req, res) {
  const installationId = req.installation.id;
  // eslint-disable-next-line no-unused-vars
  const {node_id: repoId} = req.repository;

  /* ---- ANCHOR What to do  there is a label added or removed from an issue ---- */
  // const issue_label_array = request.issue.labels;

  const labelId = req.label.node_id;
  const untriagedLabelId = await getRepoUntriagedLabel(repoId, installationId);

  // TODO if there are neither the untriaged label nor any of the triage labels now, add the untriaged label
  console.log(': ------------------');
  console.log('label_id', labelId);
  console.log(': ------------------');

  console.log(': --------------------------------------------------');
  console.log('untriaged_label id', untriagedLabelId);
  console.log(': --------------------------------------------------');

  // Success
  res.send();
}

exports.findValidProjectIds = findValidProjectIds;
exports.projectColumnGraphqlMutationPromiseGenerator = projectColumnGraphqlMutationPromiseGenerator;
exports.issueOrPrLabeled = issueOrPrLabeled;
exports.issueOrPrUnlabeled = issueOrPrUnlabeled;
