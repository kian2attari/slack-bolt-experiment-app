module.exports = `
mutation clearAllLabels($elementNodeId: ID!) {
    __typename
    clearLabelsFromLabelable(input: {labelableId: $elementNodeId}) {
      clientMutationId
    }
  }
`;
