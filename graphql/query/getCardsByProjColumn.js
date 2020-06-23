module.exports = `
query getCardsByProjColumn($repo_owner: String!, $repo_name: String!, $project_number: Int!) {
  repository(name: $repo_name, owner: $repo_owner) {
    id
    project(number: $project_number) {
      name
      columns(first: 1) {
        nodes {
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