module.exports = `
query getIdLabel($repoId: ID!, $labelName: String!) {
  __typename
  node(id: $repoId) {
    ... on Repository {
      id
      name
      label(name: $labelName) {
        id
        name
      }
    }
  }
}
`;
