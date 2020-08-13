const {checkForMentions} = require('../../helper-functions');
const {markElementAsUntriaged} = require('../../models');

async function issueOpenedReopened(app, req, res) {
  const request = req.body;
  const installationId = request.installation.id;

  const {node_id: repoId} = request.repository;
  const {
    title,
    body,
    html_url: htmlUrl,
    labels,
    created_at: createdAt,
    node_id: issueNodeId,
    user,
  } = request.issue;
  const contentCreateDate = new Date(createdAt);

  // TODO if the issue doesn't have a triage label, add the untriaged label
  // QUESTION: Should editing the issue also cause the untriaged label to be added
  try {
    await markElementAsUntriaged(labels, issueNodeId, repoId, installationId);
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

exports.issueOpenedReopened = issueOpenedReopened;
