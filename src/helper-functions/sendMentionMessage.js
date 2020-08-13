const {Messages} = require('../blocks');

/**
 * @param {{
 *   title: string;
 *   body: string;
 *   url: string;
 *   creator: string;
 *   avatar_url: string;
 *   create_date: string;
 *   mentioned_slack_user: string;
 *   is_closed: boolean;
 * }} mentionEventData
 */
module.exports = async (app, mentionEventData) => {
  // getTeamChannelId is imported within this function scope because it would otherwise conflict with the require in the webhooks
  // TODO fix this
  const {getTeamChannelId} = require('../models');
  const {
    title,
    htmlUrl,
    creator,
    contentCreateDate,
    mentionedSlackUser,
    requestorLogin,
    isClosed,
    installationId,
    reviewRequested,
  } = mentionEventData;
  return app.client.chat.postMessage({
    // Since there is no context we just use the original token
    token: process.env.SLACK_BOT_TOKEN,
    channel: isClosed ? await getTeamChannelId(installationId) : mentionedSlackUser,
    // Conditional on whether the message should go to channel or just to a user as a DM
    blocks: Messages.GithubMentionMessage(mentionEventData),
    // Just in case there is an issue loading the blocks.
    text: `${
      reviewRequested ? `${requestorLogin} requested your review ->` : ''
    }<@${mentionedSlackUser}>! ${title} posted by ${creator} on ${contentCreateDate}. Link: ${htmlUrl}`,
  });
};
