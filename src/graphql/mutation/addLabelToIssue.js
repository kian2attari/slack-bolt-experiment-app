module.exports = `
mutation addLabelToIssue($elementNodeId: ID!, $labelIds: [ID!]!) {
  addLabelsToLabelable(input: {labelableId: $elementNodeId, labelIds: $labelIds}) {
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
