const {createAppAuth} = require('@octokit/auth-app');
const {graphql} = require('@octokit/graphql');

const callGhGraphql = async (query, variables, installationId) => {
  try {
    if (typeof installationId === 'undefined') {
      throw Error('You must provide an installationId in order to query the GitHub API!');
    }

    const auth = createAppAuth({
      id: process.env.APP_ID,
      installationId,
      privateKey: process.env.PRIVATE_KEY,
    });
    const graphqlWithAuth = graphql.defaults({
      request: {
        hook: auth.hook,
      },
    });

    const data = await graphqlWithAuth(query, variables);

    return data;
  } catch (error) {
    console.error(error);
    if (Array.isArray(error.errors)) {
      // This covers higher-level more logical graphQL errors raised on gitHub's end
      return {
        errorType: 'GRAPHQL_HIGH_LEVEL',
        errorsList: error.errors,
      };
    }
    // This covers the more lower level errors such as HTTPError 500 etc
    return {errorType: 'GRAPHQL_LOW_LEVEL', ...error.name, ...error.message};
  }
};

function GraphqlCallError(errorType, errorList) {
  this.type = errorType;
  this.errorList = errorList;
}

module.exports = {
  callGhGraphql,
  GraphqlCallError,
};
