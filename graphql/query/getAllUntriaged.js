module.exports = `
query getAllUntriaged($project_ids: [ID!]!) {
  nodes(ids: $project_ids) {
    ... on Project {
      id
      name
      pendingCards(first: 20) {
        totalCount
        nodes {
          id
          url
          content {
            ... on Issue {
              id
              title
              author {
                avatarUrl(size: 40)
                login
              }
              body
              closed
              labels(first: 10) {
                nodes {
                  id
                  name
                }
              }
              url
              createdAt
              repository {
                id
                name
              }
            }
            ... on PullRequest {
              id
              title
              author {
                avatarUrl(size: 40)
                login
              }
              body
              closed
              labels(first: 10) {
                nodes {
                  id
                  name
                }
              }
              mergeable
              url
              createdAt
              repository {
                id
                name
              }
            }
          }
        }
      }
    }
  }
}
`;
