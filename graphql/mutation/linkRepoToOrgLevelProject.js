// Links the specified repo to the project board and returns all the repo's untriaged cards
module.exports = `
mutation linkRepoToOrgLevelProject($project_id: ID!, $repo_id: ID!) {
    linkRepositoryToProject(input: {projectId: $project_id, repositoryId: $repo_id}) {
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
