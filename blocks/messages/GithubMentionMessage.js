module.exports = ({
  title,
  body,
  gh_url,
  creator,
  avatar_url,
  date,
  mentioned_slack_user,
}) =>
  /* The @ symbol for mentions is not concatenated here because the convention for mentioning is different 
between mentioning users/groups/channels. To mention the channel, say when a closed issue is commented
on, the special convention is <!channel>. */
  [
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
        text: `*${title}*`,
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
            text: 'Visit issue page',
            emoji: true,
          },
          url: gh_url,
          action_id: 'link_button',
        },
      ],
    },
    {
      type: 'context',
      elements: [
        {
          type: 'plain_text',
          text: `Date: ${date}`,
          emoji: true,
        },
      ],
    },
  ];
