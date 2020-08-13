exports.assignTeamMemberToIssueOrPR = `
mutation assignTeamMemberToIssueOrPR($assignableId: ID!, $assigneeIds: [ID!]!) {
  addAssigneesToAssignable(input: {assignableId: $assignableId, assigneeIds: $assigneeIds}) {
    clientMutationId
  }
}
`;
