/* The limit of 7 cards is arbitrary to reduce the clutter (by just showing the 7 latest cards), but it can't be too high 
because each card is represented by a bunch of blocks on the App Home, and there is a limit to how many blocks you can have on a page. */
module.exports = `
query getCardsByProjColumn($columnIds: [ID!]!) {
  nodes(ids: $columnIds) {
    ... on ProjectColumn {
      id
      name
      cards(first: 7) {
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
            ... on PullRequest {
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
              mergeable
            }
          }
        }
      }
    }
  }
}

`;
