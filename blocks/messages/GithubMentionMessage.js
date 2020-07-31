module.exports = ({
  title,
  body,
  html_url,
  creator,
  avatar_url,
  content_create_date,
  mentioned_slack_user,
  review_requested,
  requestor_login,
}) => {
  const is_issue = /issues\/\d*$/.test(html_url);

  const issue_or_pr = is_issue ? 'issue' : 'PR';

  console.log('url', html_url);

  // If the message is being sent as an alert for a PR review request, this text is placed before the title
  const review_requested_text =
    review_requested && !is_issue
      ? `*:pushpin: ${requestor_login} requested your review* ->`
      : '';
  /* The @ symbol for mentions is not concatenated here because the convention for mentioning is different 
  between mentioning users/groups/channels. To mention the channel, say when a closed issue is commented
  on, the special convention is <!channel>. */
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<${mentioned_slack_user}>*`,
      },
    },

    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${review_requested_text} ${issue_or_pr}: *${title}*`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      accessory: {
        type: 'image',
        image_url: avatar_url,
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
            text: `Visit ${issue_or_pr} page`,
            emoji: true,
          },
          url: html_url,
          action_id: 'link_button',
        },
      ],
    },
    {
      type: 'context',
      elements: [
        {
          type: 'plain_text',
          text: `Date: ${content_create_date}`,
          emoji: true,
        },
      ],
    },
  ];
};
