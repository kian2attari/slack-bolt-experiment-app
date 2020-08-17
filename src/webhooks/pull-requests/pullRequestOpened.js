const {checkForMentions} = require('../../helper-functions');
const {markElementAsUntriaged} = require('../../models');

async function pullRequestOpened(req, res, app) {
  const installationId = req.installation.id;
  const {repository} = req;

  const {
    labels,
    node_id: issueNodeId,
    title,
    body,
    html_url: htmlUrl,
    user,
    created_at: createdAt,
  } = req.pull_request;

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
