const {get_repo_untriaged_label} = require('../../models');

async function issue_unlabeled(req, res) {
  const request = req.body;

  const installation_id = request.installation.id;
  // eslint-disable-next-line no-unused-vars
  const {node_id: repo_id} = request.repository;

  /* ---- ANCHOR What to do  there is a label added or removed from an issue ---- */
  // const issue_label_array = request.issue.labels;

  const label_id = request.label.node_id;
  const untriaged_label_id = await get_repo_untriaged_label(repo_id, installation_id);

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
