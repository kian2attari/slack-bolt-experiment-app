const {check_for_mentions} = require('../../helper-functions');
const {TriageTeamData} = require('../../models');
// TODO get rid of triage_team_data_obj
async function issue_opened_reopened(app, req, res) {
  const request = req.body;
  const installation_id = request.installation.id;

  const {node_id: repo_id} = request.repository;
  // TODO Use destructuring here
  const issue_url = request.issue.html_url;
  const issue_title = request.issue.title;
  const issue_body = request.issue.body;
  const issue_creator = request.issue.user.login;
  const creator_avatar_url = request.issue.user.avatar_url;
  const issue_create_date = new Date(request.issue.created_at);
  const issue_node_id = request.issue.node_id;
  const issue_labels = request.issue.labels;

  // TODO if the issue doesn't have a triage label, add the untriaged label
  // QUESTION: Should editing the issue also cause the untriaged label to be added
  await TriageTeamData.mark_element_as_untriaged(
    issue_labels,
    issue_node_id,
    repo_id,
    installation_id
  );

  const mention_event_data = {
    title: issue_title,
    text_body: issue_body,
    content_url: issue_url,
    content_creator: issue_creator,
    creator_avatar_url,
    content_create_date: issue_create_date,
    installation_id,
  };

  await check_for_mentions(app, mention_event_data);

  // Success
  res.send();
}

exports.issue_opened_reopened = issue_opened_reopened;
