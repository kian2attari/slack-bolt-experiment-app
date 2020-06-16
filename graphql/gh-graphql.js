const { createAppAuth } = require("@octokit/auth-app");
const { graphql } = require("@octokit/graphql");


// async function jwt() {
//   const { token } = await githubAppJwt({
//     id: process.env.APP_ID,
//     privateKey: process.env.PRIVATE_KEY
//   });
//   return token;
// }

// console.log(jwt())




// TODO: Installation ID
const auth = createAppAuth({
  id: process.env.APP_ID,
  installationId: '9784854',
  privateKey: process.env.PRIVATE_KEY
});




const graphqlWithAuth = graphql.defaults({
  request: {
    hook: auth.hook
  }
});



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

