const { createAppAuth } = require("@octokit/auth-app");
const { graphql } = require("@octokit/graphql");


// TODO: Installation ID
const auth = createAppAuth({
  id: process.env.APP_ID,
  privateKey: process.env.PRIVATE_KEY,
  installationId: 9783180,
});

const graphqlWithAuth = graphql.defaults({
  request: {
    hook: auth.hook,
  },
});


 
// const graphQLClient = new GraphQLClient(endpoint, {
//   headers: {
//     Authorization: "bearer " + process.env.GH_PA_TOKEN,
//   },
// })

const call_gh_graphql = async function call_gh_graphql_api(query, variables) {
    try {

        const data = await graphqlWithAuth(query, variables);

        let response = JSON.stringify(data, undefined, 2);

        console.log(response);

        return response;
    }

    catch(error) {
        console.error(error)
    }

}


module.exports = {
    call_gh_graphql
  }

