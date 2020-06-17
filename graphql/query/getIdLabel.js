module.exports = `
  query getIdLabel($repo_owner: String!, $repo_name: String!, $label_name: String!) {
    __typename
    repository(name: $repo_name, owner: $repo_owner) {
      label(name: $label_name) {
        id
      }
    }
  }
  `