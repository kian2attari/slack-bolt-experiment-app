module.exports = `
mutation clearAllLabels($element_node_id: ID!) {
    __typename
    clearLabelsFromLabelable(input: {labelableId: $element_node_id}) {
      clientMutationId
    }
  }
`;
