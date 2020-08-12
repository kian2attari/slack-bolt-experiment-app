const {checkForMentions, sendMentionMessage} = require('../../helper-functions');

async function issueCommentCreated(app, req, res) {
  // TODO refactor these constant declarations
  const request = req.body;

  const installationId = request.installation.id;
  const {html_url: htmlUrl, title, state} = request.issue;
  const {body} = request.comment;
  const commentCreator = request.comment.user.login;
  const creatorAvatarUrl = request.comment.user.avatar_url;
  const contentCreateDate = new Date(request.comment.created_at);

  if (state === 'closed') {
    const mentionEventData = {
      title: `Comment on closed issue: ${title}`,
      body,
      htmlUrl,
      contentCreator: commentCreator,
      avatarUrl: creatorAvatarUrl,
      contentCreateDate,
      mentionedSlackUser: '!channel',
      isClosed: true,
      installationId,
    };
    // TODO make a new function that sends a message to the team and adds the untriaged label to said issue
    await sendMentionMessage(app, mentionEventData);

    res.send();
  }

  const mentionEventData = {
    title: `New comment on issue: ${title}`,
    body,
    htmlUrl,
    contentCreator: commentCreator,
    creatorAvatarUrl,
    contentCreateDate,
    installationId,
  };

  await checkForMentions(app, mentionEventData);

  res.send();
}

exports.issueCommentCreated = issueCommentCreated;
