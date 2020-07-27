exports.getOrgProjectBasicData = `
query getOrgProjectBasicData($org_proj_id: ID!) {
    __typename
    node(id: $org_proj_id) {
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
