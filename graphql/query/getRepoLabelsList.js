module.exports = `
    query getRepoLabelsList($repo_owner: String!, $repo_name: String!) {
        repository(name: $repo_name, owner: $repo_owner) {
        labels(first: 15) {
            nodes {
            id
            name
            description
            }
        }
        }
    }
`;
