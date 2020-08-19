const {checkForMentions} = require('../../helper-functions');
const {Messages} = require('../../blocks');
const {getTeamChannelId} = require('../../models');

async function issueCommentCreated(req, res, app) {
  const installationId = req.installation.id;
  const {html_url: htmlUrl, title, state} = req.issue;
  const {body} = req.comment;
  const commentCreator = req.comment.user.login;
  const creatorAvatarUrl = req.comment.user.avatar_url;
  const contentCreateDate = new Date(req.comment.created_at);

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
    await app.client.chat.postMessage({
      // Since there is no context we just use the original token
      token: process.env.SLACK_BOT_TOKEN,
      channel: await getTeamChannelId(installationId),
      // Conditional on whether the message should go to channel or just to a user as a DM
      blocks: Messages.CommentOnClosedIssueMessage(mentionEventData),
      // Just in case there is an issue loading the blocks.
      text: `Comment on closed issue: ${title} posted by ${commentCreator} on ${contentCreateDate}. Link: ${htmlUrl}`,
    });

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
