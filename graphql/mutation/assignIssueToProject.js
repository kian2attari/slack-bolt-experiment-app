module.exports = `
mutation assignIssueToProject($issue_id: ID!, $project_ids: [ID!]) {
  __typename
  updateIssue(input: {id: $issue_id, projectIds: $project_ids}) {
    clientMutationId
  }
}
`;
