exports.assignPullRequestToProject = `
mutation assignPullRequestToProject($pullRequestId: ID!, $projectIds: [ID!]) {
  updatePullRequest(input: {pullRequestId: $pullRequestId, projectIds: $projectIds}) {
    clientMutationId
  }
}
`;
