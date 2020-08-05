exports.removeLabels = `
mutation removeLabels($labelableId: ID!, $labelIds: [ID!]!) {
    removeLabelsFromLabelable(input: {labelableId: $labelableId, labelIds: $labelIds}) {
      clientMutationId
    }
  }
`;
