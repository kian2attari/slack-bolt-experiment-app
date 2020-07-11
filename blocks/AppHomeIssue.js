module.exports = card_array => {
  const issues_block = card_array.flatMap(card => {
    const card_data = card.content;
    const card_id = card_data.id;
    const card_labels = card_data.labels.nodes;
    const label_initial_options = card_labels.map(label => {
      return {
        'text': {
          'type': 'plain_text',
          'text': label.name,
        },
        'value': card_id,
      };
    });

    console.log('card_data', card_data);

    console.log('card_labels', card_labels);

    console.log('label_initial_options', label_initial_options);

    return [
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': `*${card_data.title}* \n ${card_data.body}`,
        },
      },
      {
        'type': 'actions',
        'elements': [
          {
            'type': 'button',
            'text': {
              'type': 'plain_text',
              'text': 'View Issue',
              'emoji': true,
            },
            'url': card_data.url,
            'action_id': 'link_button',
          },
        ],
      },
      /* The GitHub GraphQL API needs both the issue ID and 
            the label id to assign a label. The block_id is set as 
            the id of the issue so that the unique issue id is sent over 
            with the label id when a label is selected. */

      {
        'type': 'section',
        // "block_id": issue_id,
        'text': {
          'type': 'mrkdwn',
          'text': 'Label this issue',
        },

        'accessory': {
          'action_id': 'label_list',
          'type': 'multi_external_select',
          'placeholder': {
            'type': 'plain_text',
            'text': 'Select a label',
          },
          'min_query_length': 0,
          // TODO Initial Options
          ...(label_initial_options.length !== 0 && {
            'initial_options': label_initial_options,
          }),
        },
      },
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': 'Assign the issue',
        },
        'accessory': {
          'type': 'users_select',
          'placeholder': {
            'type': 'plain_text',
            'text': 'Select a user',
            'emoji': true,
          },
        },
      },
      {
        'type': 'context',
        'elements': [
          {
            'type': 'mrkdwn',
            'text': 'Opened by',
          },
          {
            'type': 'image',
            'image_url': card_data.author.avatarUrl,
            'alt_text': `${card_data.author.login}`,
          },
          {
            'type': 'mrkdwn',
            'text': `*${card_data.author.login}*`,
          },
        ],
      },
      {
        'type': 'divider',
      },
    ];
  });

  return issues_block;
};
