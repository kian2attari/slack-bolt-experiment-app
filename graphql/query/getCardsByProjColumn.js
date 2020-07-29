// TODO get PR cards as well
module.exports = `
query getCardsByProjColumn($column_id: ID!) {
  node(id: $column_id) {
    ... on ProjectColumn {
      id
      name
      cards(first: 20) {
        nodes {
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
                }
              }
              assignees(first: 10) {
                nodes {
                  id
                  login
                }
              }
              closed
            }
          }
        }
      }
    }
  }
}
`;
