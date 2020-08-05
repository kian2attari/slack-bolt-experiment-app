module.exports = `
query getIdLabel($repo_id: ID!, $label_name: String!) {
  __typename
  node(id: $repo_id) {
    ... on Repository {
      id
      name
      label(name: $label_name) {
        id
        name
      }
    }
  }
}
`;
