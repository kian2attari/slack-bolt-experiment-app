const {createAppAuth} = require('@octokit/auth-app');
const {graphql} = require('@octokit/graphql');

const call_gh_graphql = async (query, variables, installation_id) => {
  try {
    if (typeof installation_id === 'undefined') {
      throw Error(
        'You must provide an installation_id in order to query the GitHub API!'
      );
    }

    const auth = createAppAuth({
      id: process.env.APP_ID,
      installationId: installation_id,
      privateKey: process.env.PRIVATE_KEY,
    });
    const graphqlWithAuth = graphql.defaults({
      request: {
        hook: auth.hook,
      },
    });

    const data = await graphqlWithAuth(query, variables);

    const response = JSON.stringify(data, undefined, 2);

    console.log(': -------------------------------------');
    console.log('call_gh_graphql -> response', response);
    console.log(': -------------------------------------');

    return data;
  } catch (error) {
    console.error(error);
    if (Array.isArray(error.errors)) {
      // This covers higher-level more logical graphQL errors raised on gitHub's end
      return {
        error_type: 'GRAPHQL_HIGH_LEVEL',
        errors_list: error.errors,
      };
    }
    // This covers the more lower level errors such as HTTPError 500 etc
    return {error_type: 'GRAPHQL_LOW_LEVEL', ...error.name, ...error.message};
  }
};

function Graphql_call_error(error_type, error_list) {
  this.type = error_type;
  this.error_list = error_list;
}

module.exports = {
  call_gh_graphql,
  Graphql_call_error,
};
