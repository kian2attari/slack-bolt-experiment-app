module.exports = `
query getOrgAndUserLevelProjects($repo_id: ID!) {
    node(id: $repo_id) {
      ... on Repository {
        owner {
          ... on Organization {
            id
            name
            projects(first: 10) {
              nodes {
                id
                name
              }
            }
          }
          ... on User {
            id
            login
            projects(first: 10) {
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
`;
