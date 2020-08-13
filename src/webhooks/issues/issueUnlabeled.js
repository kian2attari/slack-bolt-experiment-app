const {getRepoUntriagedLabel} = require('../../models');

async function issueUnlabeled(req, res) {
  const request = req.body;

  const installationId = request.installation.id;
  // eslint-disable-next-line no-unused-vars
  const {node_id: repoId} = request.repository;

  /* ---- ANCHOR What to do  there is a label added or removed from an issue ---- */
  // const issue_label_array = request.issue.labels;

  const labelId = request.label.node_id;
  const untriagedLabelId = await getRepoUntriagedLabel(repoId, installationId);

  // if (label_id == untriaged_label.label_id) {
  //   const addCardToColumn_variables = {"issue": {"projectColumnId" : untriaged_label.column_id, "contentId": issue_node_id}}
  //   graphql.callGhGraphql(mutation.addCardToColumn, addCardToColumn_variables)
  // }
  // TODO if there are neither the untriaged label nor any of the triage labels now, add the untriaged label
  console.log(': ------------------');
  console.log('label_id', labelId);
  console.log(': ------------------');

  console.log(': --------------------------------------------------');
  console.log('untriaged_label id', untriagedLabelId);
  console.log(': --------------------------------------------------');

  // Success
  res.send();
}

exports.issueUnlabeled = issueUnlabeled;
