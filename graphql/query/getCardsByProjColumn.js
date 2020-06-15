module.exports = `
query getCardByProjColumn($owner: String!, $name: String!, $number: Int!) {
    repository(name: $name, owner: $owner) {
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