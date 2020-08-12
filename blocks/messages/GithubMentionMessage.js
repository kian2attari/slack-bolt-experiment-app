module.exports = ({
  title,
  body,
  htmlUrl,
  creator,
  avatarUrl,
  contentCreateDate,
  mentionedSlackUser,
  reviewRequested,
  requestorLogin,
}) => {
  // TODO put this in constants under important RegEx
  const isIssue = /issues\/\d*$/.test(htmlUrl);

  const issueOrPr = isIssue ? 'issue' : 'PR';

  console.log('url', htmlUrl);

  // If the message is being sent as an alert for a PR review request, this text is placed before the title
  const reviewRequestedText =
    reviewRequested && !isIssue
      ? `*:pushpin: ${requestorLogin} requested your review* ->`
      : '';
  /* The @ symbol for mentions is not concatenated here because the convention for mentioning is different 
  between mentioning users/groups/channels. To mention the channel, say when a closed issue is commented
  on, the special convention is <!channel>. */
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<${mentionedSlackUser}>*`,
      },
    },

    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${reviewRequestedText} ${issueOrPr}: *${title}*`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      accessory: {
        type: 'image',
        image_url: avatarUrl,
        alt_text: `${creator}'s GitHub avatar`,
      },
      text: {
        type: 'plain_text',
        text: body,
        emoji: true,
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: `Visit ${issueOrPr} page`,
            emoji: true,
          },
          url: htmlUrl,
          action_id: 'link_button',
        },
      ],
    },
    {
      type: 'context',
      elements: [
        {
          type: 'plain_text',
          text: `Date: ${contentCreateDate}`,
          emoji: true,
        },
      ],
    },
  ];
};
