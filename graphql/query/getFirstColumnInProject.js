module.exports = `
  query getFirstColumnInProject($repo_name: String!, $owner_name: String!, $project_name: String!) {
    __typename
    repository(name: $repo_name, owner: $owner_name) {
      projects(search: $project_name, first: 1) {
        nodes {
          id
          number
          columns(first: 1) {
            nodes {
              id
              name
            }
          }
          name
        }
      }
    }
  }
  `
