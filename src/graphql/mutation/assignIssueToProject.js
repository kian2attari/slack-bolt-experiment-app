module.exports = `
mutation assignIssueToProject($issueId: ID!, $projectIds: [ID!]) {
  __typename
  updateIssue(input: {id: $issueId, projectIds: $projectIds}) {
    clientMutationId
  }
}
`;
