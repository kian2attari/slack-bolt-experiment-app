const {add_new_document} = require('../../db');

exports.new_gitwave_installation = async (req, res) => {
  console.log('new installation -> req', req.body);

  const {
    installation: {
      account: {login, node_id, type},
      id,
      repository_selection,
    },
    repositories: repositories_array,
  } = req.body;

  const new_installation_obj = {};

  /* The ID of the app installation. This ID is important because it's needed to generate the JWT
  that authenticates the app to access the GitHub API. The GitHub documentation isn't clear, but after a lot of 
  exploring and experimenting, it seems that the installation_id is unique for every org/account 
  the github app is installed on. So that means even when the app is only installed on a single repo
  (rather than an org-scale install), the installation id would be the same for all repos under that
  user/org the app is installed on. The installation ID stays the same even if the installation scope
  is later changed to an org-level installation and vice versa. The only case the installation ID would change for a repo
  would be if you uninstalled the app entireley from the repo and then reinstalled it. */
  // A new document is created for every Installation ID
  new_installation_obj.gitwave_github_app_installation_id = id;
  /* Details about the current scope of the installation. If repository_selection is 'all', then we know the app was installed 
    on an org-level. If repository_selection is 'selected', then we know the app was installed on a repo-level */
  new_installation_obj.gitwave_github_app_installation_scope = repository_selection;

  // Information about the account that the GitWave GitHub app was installed on
  new_installation_obj.org_account = {login, node_id, type};

  // The repos the app was installed on/currently has access to
  // The team should be subscribed to these repos
  // TODO if the installation is org level, the team should be subscribed to every future repo as well
  // Converts the array of repo objs to an object that maps the repo full name -> repo obj
  new_installation_obj.subscribed_repos = repositories_array.reduce(
    (obj, item) => ({...obj, [item.full_name]: item}),
    {}
  );

  await add_new_document(new_installation_obj);

  res.send();
};
