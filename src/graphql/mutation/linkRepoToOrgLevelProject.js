// Links the specified repo to the project board and returns all the repo's untriaged cards
module.exports = `
mutation linkRepoToOrgLevelProject($projectId: ID!, $repoId: ID!) {
    linkRepositoryToProject(input: {projectId: $projectId, repositoryId: $repoId}) {
      clientMutationId
      repository {
        issues(filterBy: {labels: "untriaged"}, first: 10) {
          nodes {
            id
            title
            author {
              login
              avatarUrl(size: 40)
            }
            body
            createdAt
            url
          }
        }
      }
    }
  }
  `;
