const {check_for_mentions} = require('../../helper-functions');
const {TriageTeamData} = require('../../models');

async function pull_request_opened(app, req, res) {
  // EXTRA_TODO strip request to req.body in GitHubWebhookListener.js so we dont have to do this everytime
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

  const content_create_date = new Date(created_at);

  try {
    await TriageTeamData.mark_element_as_untriaged(
      labels,
      issue_node_id,
      repository.node_id,
      installation_id
    );
  } catch (error) {
    console.error(error);
  }

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

exports.pull_request_opened = pull_request_opened;
