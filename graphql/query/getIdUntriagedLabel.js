module.exports = `
  query getIdUntriagedLabel {
    __typename
    repository(name: "dummy-kian-test-repo", owner: "slackapi") {
      label(name: "untriaged") {
        id
      }
    }
  }
  `