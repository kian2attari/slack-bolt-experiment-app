const {
  regExp: {isIssue},
} = require('../../constants');

// TODO combine with GitHubMentionMessage, there's quite a bit in common

module.exports = ({title, body, htmlUrl, creator, avatarUrl, contentCreateDate}) => {
  const isIssueBool = isIssue.test(htmlUrl);

  const issueOrPr = isIssueBool ? 'issue' : 'PR';

  /* The @ symbol for mentions is not concatenated here because the convention for mentioning is different 
  between mentioning users/groups/channels. To mention the channel, say when a closed issue is commented
  on, the special convention is <!channel>. */
  return [
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${issueOrPr}: *${title}*`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      accessory: {
        type: 'image',
        'image_url': avatarUrl,
        'alt_text': `${creator}'s GitHub avatar`,
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
          'action_id': 'link_button',
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
