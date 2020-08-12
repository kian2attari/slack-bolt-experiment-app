exports.getOrgProjectBasicData = `
query getOrgProjectBasicData($orgProjId: ID!) {
    __typename
    node(id: $orgProjId) {
      ... on Project {
        id
        name
        columns(first: 10) {
          nodes {
            id
            name
          }
        }
      }
    }
  }`;
