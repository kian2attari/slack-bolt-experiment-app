exports.getRepoLevelProjectBoards = `query getRepoLevelProjectBoards($repoNodeIds: [ID!]!) {
  nodes(ids: $repoNodeIds) {
    ... on Repository {
      id
      name
      projects(last: 1, orderBy: {field: UPDATED_AT, direction: ASC}) {
        nodes {
          id
          name
        }
      }
    }
  }
}`;
