module.exports = `
  query getFirstColumnInProject($repo_name: String!, $repo_owner: String!, $project_name: String!) {
    __typename
    repository(name: $repo_name, owner: $repo_owner) {
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
`;
