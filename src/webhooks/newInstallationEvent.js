const {addNewDocument} = require('../db');

exports.newGitwaveInstallation = async (req, res) => {
  // TODO HIGH also grab the last-updated project board for that repository (as the repo project board) so that changes can be synced to it as well
  const {
    installation: {
      /* eslint-disable-next-line custom-gitwave-rules/camelCaseWithFixer */
      account: {login, node_id: nodeId, type},
      id,
      /* eslint-disable-next-line custom-gitwave-rules/camelCaseWithFixer */
      repository_selection: repositorySelection,
    },
    repositories: repositoriesArray,
  } = req;

  const newInstallationObj = {};

  /* The ID of the app installation. This ID is important because it's needed to generate the JWT
  that authenticates the app to access the GitHub API. The GitHub documentation isn't clear, but after a lot of 
  exploring and experimenting, it seems that the installation_id is unique for every org/account 
  the github app is installed on. So that means even when the app is only installed on a single repo
  (rather than an org-scale install), the installation id would be the same for all repos under that
  user/org the app is installed on. The installation ID stays the same even if the installation scope
  is later changed to an org-level installation and vice versa. The only case the installation ID would change for a repo
  would be if you uninstalled the app entirely from the repo and then reinstalled it. */
  // A new document is created for every Installation ID
  newInstallationObj.gitwaveGithubAppInstallationId = id;
  /* Details about the current scope of the installation. If repositorySelection is 'all', then we know the app was installed 
    on an org-level. If repositorySelection is 'selected', then we know the app was installed on a repo-level */
  newInstallationObj.gitwaveGithubAppInstallationScope = repositorySelection;

  // Information about the account that the GitWave GitHub app was installed on
  newInstallationObj.orgAccount = {login, nodeId, type};

  // The repos the app was installed on/currently has access to
  // The team should be subscribed to these repos
  // TODO if the installation is org level, the team should be subscribed to every future repo as well
  // Converts the array of repo objs to an object that maps the repo full name -> repo obj
  newInstallationObj.subscribedRepos = repositoriesArray.reduce(
    (obj, item) => ({
      ...obj,
      [item.full_name]: {
        nodeId: item.node_id,
        fullName: item.full_name,
        name: item.name,
        private: item.private,
      },
    }),
    {}
  );

  await addNewDocument(newInstallationObj);

  res.send();
};
