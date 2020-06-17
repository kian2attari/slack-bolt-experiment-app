module.exports = `
query getCardByProjColumn($repo_owner: String!, $repo_name: String!, $number: Int!) {
    repository(name: $repo_name, owner: $repo_owner) {
        id
        project(number: $number) {
            name
            columns(first: 1) {
            edges {
                node {
                name
                cards(first: 20) {
                    edges {
                    node {
                        content {
                        ... on Issue {
                            title
                            url
                        }
                        }
                    }
                    }
                }
                }
            }
            }
        }
        }

}
`