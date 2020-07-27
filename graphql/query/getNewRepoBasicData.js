exports.getNewRepoBasicData = `
query getNewRepoBasicData($repo_owner: String!, $repo_name: String!) {
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
            }
          }
          state
        }
      }
      labels(first: 12) {
        nodes {
          id
          name
          description
        }
      }
      owner {
        login
      }
      name
    }
  }
`;
