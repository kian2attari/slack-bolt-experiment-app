module.exports = `
query getNumOfCardsByColumn($repo_owner: String!, $repo_name: String!, $project_number: Int!) {
  repository(name: $repo_name, owner: $repo_owner) {
    id
    project(number: $project_number) {
      name
      columns(first: 10) {
        totalCount
        nodes {
          cards {
            totalCount
          }
          name
        }
      }
    }
  }
}
`;
