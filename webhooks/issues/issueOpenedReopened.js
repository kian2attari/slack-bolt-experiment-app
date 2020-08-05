const {check_for_mentions} = require('../../helper-functions');
const {TriageTeamData} = require('../../models');

async function issue_opened_reopened(app, req, res) {
  const request = req.body;
  const installation_id = request.installation.id;

  const {node_id: repo_id} = request.repository;
  const {
    title,
    body,
    html_url,
    labels,
    created_at,
    node_id: issue_node_id,
    user,
  } = request.issue;
  const content_create_date = new Date(created_at);

  // TODO if the issue doesn't have a triage label, add the untriaged label
  // QUESTION: Should editing the issue also cause the untriaged label to be added
  await TriageTeamData.mark_element_as_untriaged(
    labels,
    issue_node_id,
    repo_id,
    installation_id
  );

  const mention_event_data = {
    title,
    body,
    html_url,
    content_creator: user.login,
    creator_avatar_url: user.avatar_url,
    content_create_date,
    installation_id,
  };

  await check_for_mentions(app, mention_event_data);

  // Success
  res.send();
}

exports.issue_opened_reopened = issue_opened_reopened;
