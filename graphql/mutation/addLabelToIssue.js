module.exports = `
mutation addLabelToIssue($element_node_id: String!, $label_id: String!) {
    addLabelsToLabelable(input: {labelableId: $element_node_id, labelIds: $label_id}) {
        labelable {
            labels(last: 1, orderBy: {direction: DESC, field: NAME}) {
              edges {
                node {
                  name
                }
              }
            }
          }
    }
  }
`

// The labelable query on line 7 is a redundancy to check if the label was added
