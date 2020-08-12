module.exports = `
    mutation addCardToColumn($issue: AddProjectCardInput!) {
        addProjectCard(input: $issue) {
        cardEdge {
            node {
            id
            }
        }
        projectColumn {
            id
            name
        }
        }
    }
`;
