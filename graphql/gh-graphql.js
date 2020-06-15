const { request, GraphQLClient } = require('graphql-request')
// Not sure if this is required, but testing the app locally raises an error if fetch is not there
// fetch = require("node-fetch");

const endpoint = 'https://api.github.com/graphql'
 
const graphQLClient = new GraphQLClient(endpoint, {
  headers: {
    Authorization: "bearer " + process.env.GH_PA_TOKEN,
  },
})

const call_gh_graphql = async function call_gh_graphql_api(query, variables) {
    try {

        const data = await graphQLClient.request(query, variables);

        let response = JSON.stringify(data, undefined, 2);

        console.log(response);

        return response;
    }

    catch(error) {
        console.error(error)
    }

}


module.exports = {
    call_gh_graphql,
    graphQLClient
  }