/* Gets all the untriaged cards associated with the project input. It also returns all the triage labels of the repo that 
the issues come from. Triage labels are identified by having MAIN-TRIAGE: at the beginning of their label descriptions */
module.exports = `
query getAllUntriaged($projectIds: [ID!]!) {
  nodes(ids: $projectIds) {
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
                labels(query: "M-T:", first: 10, orderBy: {field: NAME, direction: ASC}) {
                  nodes {
                    id
                    name
                  }
                }
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
                labels(query: "M-T:", first: 10, orderBy: {field: NAME, direction: ASC}) {
                  nodes {
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
  }
}
`;
