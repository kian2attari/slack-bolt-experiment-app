module.exports = `
mutation addLabelToIssue($element_node_id: ID!, $label_ids: [ID!]!) {
  addLabelsToLabelable(input: {labelableId: $element_node_id, labelIds: $label_ids}) {
    labelable {
      labels(last: 5, orderBy: {direction: DESC, field: NAME}) {
        nodes {
          name
        }
      }
    }
  }
}
`;

// The labelable query on line 7 is a redundancy to check if the label was added
