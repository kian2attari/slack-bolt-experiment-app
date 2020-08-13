module.exports = `
query getOrgAndUserLevelProjects($orgOrUserId: ID!) {
  node(id: $orgOrUserId) {
    ... on Organization {
      id
      name
      projects(first: 10) {
        nodes {
          id
          name
        }
      }
      login
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
`;
