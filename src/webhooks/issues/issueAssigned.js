const {
  findValidProjectIds,
  projectColumnGraphqlMutationPromiseGenerator,
} = require('../commonFunctions');
const {graphql, query} = require('../../graphql');

async function issueAssigned(req, res) {
  const installationId = req.installation.id;

  const {full_name: repoFullName} = req.repository;

  const elementNodeId = req.issue.node_id;

  const currentIssueLabelsArray = req.issue.labels;

  const {projectColumnsArray} = await findValidProjectIds(
    installationId,
    repoFullName,
    currentIssueLabelsArray
  );

  console.log('projectColumnsArray', projectColumnsArray);

  const variablesGetCardsByProjColumn = {
    columnIds: projectColumnsArray.map(project => project['To Do'].id),
  };

  // TODO use getCardsByColumn function in TriageTeamData
  const projectCardsResponse = await graphql.callGhGraphql(
    query.getCardsByProjColumn,
    variablesGetCardsByProjColumn,
    installationId
  );

  console.log('projectCardsResponse', projectCardsResponse);

  const filteredIssueCards = projectCardsResponse.nodes
    .map(
      project => project.cards.nodes.find(card => card.content.id === elementNodeId) // We find the card in each project board that map to the issue/PR that just got labeled
    )
    .filter(card => typeof card !== 'undefined'); // In the case that the card exists in the org level board but not the repo level board

  console.log('filteredIssueCards issue assigned', filteredIssueCards);
  console.log('projectColumnsArray issue assigned', projectColumnsArray);

  const projectColumnGraphqlMutationPromises = projectColumnGraphqlMutationPromiseGenerator(
    projectColumnsArray,
    filteredIssueCards,
    installationId
  );

  await Promise.all(projectColumnGraphqlMutationPromises('In Progress'));

  // Success
  res.send();
}
exports.issueAssigned = issueAssigned;
