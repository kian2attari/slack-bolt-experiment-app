// TODO get PR cards as well
module.exports = `
query getCardsByProjColumn($columnIds: [ID!]!) {
  nodes(ids: $columnIds) {
    ... on ProjectColumn {
      id
      name
      cards(first: 20) {
        nodes {
          id
          url
          content {
            ... on Issue {
              author {
                avatarUrl(size: 40)
                login
              }
              id
              body
              url
              title
              labels(first: 12) {
                nodes {
                  name
                  id
                  description
                }
              }
              assignees(first: 10) {
                nodes {
                  id
                  login
                }
              }
              closed
              repository {
                labels(first: 15) {
                  nodes {
                  id
                  name
                  description
                  }
              }
              }
            }
          }
        }
      }
    }
  }
}
`;
