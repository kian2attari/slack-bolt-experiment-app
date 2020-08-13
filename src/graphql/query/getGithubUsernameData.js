exports.getGithubUsernameData = `
query getGithubUsernameData($githubUsername: String!, $organizationName: String!) {
  __typename
  user(login: $githubUsername) {
    id
    login
    name
    organization(login: $organizationName) {
      login
      name
    }
  }
}`;
