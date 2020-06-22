module.exports = `
query getCardByProjColumn($repo_owner: String!, $repo_name: String!, $project_number: Int!) {
    repository(name: $repo_name, owner: $repo_owner) {
      id
      project(number: $project_number) {
        name
        columns(first: 1) {
          edges {
            node {
              name
              cards(first: 20) {
                edges {
                  node {
                    content {
                      ... on Issue {
                        title
                        url
                        body
                        author {
                          login
                          avatarUrl(size: 40)
                        }
                        id
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
  }
`