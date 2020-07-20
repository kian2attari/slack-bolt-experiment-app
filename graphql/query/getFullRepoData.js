module.exports = `
query getFullRepoData($repo_owner: String!, $repo_name: String!) {
    repository(name: $repo_name, owner: $repo_owner) {
      id
      projects(first: 5, orderBy: {field: UPDATED_AT, direction: ASC}) {
        nodes {
          id
          name
          number
          columns(first: 10) {
            nodes {
              id
              name
              cards(first: 20) {
                totalCount
                nodes {
                  content {
                    ... on Issue {
                      id
                      author {
                        avatarUrl(size: 40)
                        login
                      }
                      body
                      title
                      url
                      labels(first: 12) {
                        nodes {
                          id
                          name
                        }
                      }
                    }
                    ... on PullRequest {
                      id
                      author {
                        avatarUrl(size: 40)
                        login
                      }
                      body
                      number
                      title
                      url
                      labels(first: 10) {
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
      labels(first: 12) {
        nodes {
          id
          name
          description
        }
      }
    }
  }  
`;
