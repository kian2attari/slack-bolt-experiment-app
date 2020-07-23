function issue_unlabeled(triage_team_data_obj, app, req, res) {
  console.log(`${req.headers['x-github-event']}.${req.body.action} arrived!`);
  const request = req.body;
  // eslint-disable-next-line no-unused-vars
  const {full_name: repo_path, id: repo_id} = request.repository;

  const repo_obj = triage_team_data_obj.get_team_repo_subscriptions(repo_path);
  console.log(': ------------------');
  console.log('repo_obj', repo_obj);
  console.log(': ------------------');

  if (typeof repo_obj === 'undefined') {
    console.log(`${repo_path}: Team is not currently subscribed to this repo!`);
    res.send();
    return;
  }

  /* ---- ANCHOR What to do  there is a label added or removed from an issue ---- */
  // const issue_label_array = request.issue.labels;

  const label_id = request.label.node_id;
  const untriaged_label_id = repo_obj.untriaged_settings.untriaged_label.label_id;

  // const label_id = request.label.node_id
  // console.log(label_id)
  // console.log(untriaged_label.label_id)
  // if (label_id == untriaged_label.label_id) {
  //   const addCardToColumn_variables = {"issue": {"projectColumnId" : untriaged_label.column_id, "contentId": issue_node_id}}
  //   graphql.call_gh_graphql(mutation.addCardToColumn, addCardToColumn_variables)
  // }
  // TODO if there are neither the untriaged label nor any of the triage labels now, add the untriaged label
  console.log(': ------------------');
  console.log('label_id', label_id);
  console.log(': ------------------');

  console.log(': --------------------------------------------------');
  console.log('untriaged_label id', untriaged_label_id);
  console.log(': --------------------------------------------------');

  // Success
  res.send();
}

exports.issue_unlabeled = issue_unlabeled;
