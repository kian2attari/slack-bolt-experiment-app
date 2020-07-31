const {check_for_mentions} = require('../../helper-functions');
const {TriageTeamData} = require('../../models');

async function pull_request_opened(app, req, res) {
  const request = req.body;
  const installation_id = request.installation.id;
  const {repository} = request;

  const {
    labels,
    node_id: issue_node_id,
    title,
    body,
    html_url,
    user,
    created_at,
  } = request.pull_request;

  await TriageTeamData.mark_element_as_untriaged(
    labels,
    issue_node_id,
    repository.node_id,
    installation_id
  );

  const mention_event_data = {
    title,
    text_body: body,
    content_url: html_url,
    content_creator: user.login,
    creator_avatar_url: user.avatar_url,
    content_create_date: created_at,
    installation_id,
  };

  await check_for_mentions(app, mention_event_data);
  // Success
  res.send();
}

exports.pull_request_opened = pull_request_opened;
