module.exports = `
query getOrgAndUserLevelProjects($org_or_user_id: ID!) {
  node(id: $org_or_user_id) {
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
