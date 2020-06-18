module.exports = `
query GetProjectList($repo_name: String!, $owner_name: String!) {
    __typename
    repository(name: $repo_name, owner: $owner_name) {
      projects(first: 10, orderBy: {field: NAME, direction: ASC}) {
        nodes {
          name
          number
          id
        }
      }
    }
  }
  `
  