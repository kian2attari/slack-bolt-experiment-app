module.exports = `
query GetProjectList($repo_name: String!, $repo_owner: String!) {
    __typename
    repository(name: $repo_name, owner: $repo_owner) {
      projects(first: 5, orderBy: {field: NAME, direction: ASC}) {
        nodes {
          name
          number
          id
        }
      }
    }
  }
  `
  