const { createAppAuth } = require("@octokit/auth-app");
const { graphql } = require("@octokit/graphql");
const { githubAppJwt } = require('universal-github-app-jwt')
const axios = require('axios').default;

// Generates the JWT token needed to get the installation_id in init()
const jwt_token = async() => {
  const { token } = await githubAppJwt({
    id: process.env.APP_ID,
    privateKey: process.env.PRIVATE_KEY
  })
    return token
}


let graphqlWithAuth;

let has_init_run = false;

// Call github API endpoint to get installation_id for that specific installation
const init = async (gh_variables) => {
  let jwt_obj = await jwt_token();

  const response = await axios.get(`https://api.github.com/repos/${gh_variables.owner}/${gh_variables.repo_name}/installation`, {
    headers: {
      authorization: `bearer ${jwt_obj}`,
      accept: "application/vnd.github.machine-man-preview+json"
    }
  })

  const installation_id = response.data.id
  console.log(installation_id)


  const auth = createAppAuth({
    id: process.env.APP_ID,
    installationId: installation_id,
    privateKey: process.env.PRIVATE_KEY
  });
  
  
  
  graphqlWithAuth = graphql.defaults({
    request: {
      hook: auth.hook
    }
  });

  has_init_run = true;
}; 



const call_gh_graphql = async(query, variables, gh_variables = undefined) => {
    try {
        if (!has_init_run) {
          if (gh_variables === undefined) {
            throw 'You must provide an object with an owner and repository value for the init(gh_variables) function!'
          }
          await init(gh_variables)
        }
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