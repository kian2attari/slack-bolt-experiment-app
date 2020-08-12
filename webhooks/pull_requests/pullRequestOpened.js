const {checkForMentions} = require('../../helper-functions');
const {markElementAsUntriaged} = require('../../models');

async function pullRequestOpened(app, req, res) {
  // EXTRA_TODO strip request to req.body in GitHubWebhookListener.js so we dont have to do this everytime
  const request = req.body;
  const installationId = request.installation.id;
  const {repository} = request;

  const {
    labels,
    node_id: issueNodeId,
    title,
    body,
    html_url: htmlUrl,
    user,
    created_at: createdAt,
  } = request.pull_request;

  const contentCreateDate = new Date(createdAt);

  try {
    await markElementAsUntriaged(labels, issueNodeId, repository.node_id, installationId);
  } catch (error) {
    console.error(error);
  }

  const mentionEventData = {
    title,
    body,
    htmlUrl,
    contentCreator: user.login,
    creatorAvatarUrl: user.avatar_url,
    contentCreateDate,
    installationId,
  };

  await checkForMentions(app, mentionEventData);
  // Success
  res.send();
}

exports.pullRequestOpened = pullRequestOpened;
