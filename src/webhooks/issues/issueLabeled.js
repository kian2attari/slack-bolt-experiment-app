const {query, mutation, graphql} = require('../../graphql');

const {
  regExp: {findTriageLabels},
} = require('../../constants');
const {
  findValidProjectIds,
  projectColumnGraphqlMutationPromiseGenerator,
} = require('../commonFunctions');

async function issueLabeled(req, res) {
  const installationId = req.installation.id;

  const {full_name: repoFullName} = req.repository;

  const elementNodeId = req.issue.node_id;

  const currentIssueLabelsArray = req.issue.labels;

  const {name: labelName, description: labelDescription} = req.label;

  const {validProjectIds, projectColumnsArray} = await findValidProjectIds(
    installationId,
    repoFullName,
    currentIssueLabelsArray
  );

  if (labelName === 'untriaged') {
    console.log('project board id array', validProjectIds);
    const variablesAssignIssueToProject = {
      issueId: elementNodeId,
      projectIds: validProjectIds,
    };

    // REVIEW should i return the promise up to webhookEvents.js rather than awaiting it here and returning nothing?
    await graphql.callGhGraphql(
      mutation.assignIssueToProject,
      variablesAssignIssueToProject,
      installationId
    );

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

exports.issueLabeled = issueLabeled;
