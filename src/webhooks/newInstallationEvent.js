const {addNewDocument} = require('../db');
const {graphql, query} = require('../graphql');

exports.newGitwaveInstallation = async (req, res) => {
  const {
    installation: {
      account: {login, node_id: nodeId, type},
      id: installationId,
      repository_selection: repositorySelection,
    },
    repositories: repositoriesArray,
  } = req;

  // We grab the repo-level project board for each repo. These repo-level project boards will be synced to the org-level project board
  const {nodes: repoLevelProjectsResponse} = await graphql.callGhGraphql(
    query.getRepoLevelProjectBoards,
    {repoNodeIds: repositoriesArray.map(repo => repo.node_id)},
    installationId
  );

  const repoLevelProjectsArray = repoLevelProjectsResponse.map(project => {
    if (project.projects.nodes.length !== 0) {
      const projectObj = project.projects.nodes[0];
      projectObj.columns = projectObj.columns.nodes.reduce(
        (accObj, column) => ({...accObj, [column.name]: column}),
        {}
      );
      return projectObj;
    }
    return null; // Returning null here is necessary in order to preserve the indexing for the repoLevelProject property on line 59
  });

  const newInstallationObj = {
    /* The ID of the app installation. This is needed to use the GitHub GraphQL API.
    The GitHub documentation isn't clear, but after a lot of exploring and experimenting, it seems that 
    the installation_id is unique for every org/account the github app is installed on. So that means even
    when the app is only installed on a single repo (rather than an org-scale install), the installation id
    would be the same for all repos under that user/org the app is installed on. The installation ID stays 
    the same even if the installation scope is later changed to an org-level installation and vice versa. 
    The only case the installation ID would change for a repo would be if you uninstalled the app entirely 
    from the repo and then reinstalled it. A new document is created in the DB for every Installation ID */
    gitwaveGithubAppInstallationId: installationId,
    /* Details about the current scope of the installation. If repositorySelection is 'all', then we know the app was installed 
    on an org-level. If repositorySelection is 'selected', then we know the app was installed on a repo-level */
    gitwaveGithubAppInstallationScope: repositorySelection,
    // Information about the account that the GitWave GitHub app was installed on
    orgAccount: {login, nodeId, type},

    // The repos the app was installed on/currently has access to. The team should be subscribed to these repos
    // TODO if the installation is org level, the team should be subscribed to every future repo as well
    subscribedRepos: repositoriesArray.reduce(
      (obj, item, currIndex) => ({
        ...obj,
        [item.full_name]: {
          nodeId: item.node_id,
          fullName: item.full_name,
          name: item.name,
          private: item.private,
          repoLevelProject: repoLevelProjectsArray[currIndex],
        },
      }),
      {}
    ),
  };

  try {
    await addNewDocument(newInstallationObj);
  } catch (error) {
    console.error(error);
    // This could mean a duplicate installation in the DB
  } finally {
    res.send();
  }
};
