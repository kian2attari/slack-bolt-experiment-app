exports.getGithubUsernameData = `
query getGithubUsernameData($githubUsername: String!) {
  __typename
  user(login: $githubUsername) {
    id
    login
    name
  }
}`;
