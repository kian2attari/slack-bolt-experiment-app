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

  /* Details about the installation. If repository_selection is 'all', then we know the app was installed 
    on an org-level. If repository_selection is 'selected', then we know the app was installed on a repo-level */
  new_installation_obj.gitwave_github_app_installation = {id, repository_selection};

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
