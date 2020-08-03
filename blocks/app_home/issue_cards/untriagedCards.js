exports.untriaged_cards = ({external_issue_card_array, internal_issue_card_array}) => {
  const external_issues_block = external_issue_card_array.flatMap(card => {
    const card_data = card.content;
    const card_repo_triage_labels = card_data.repository.labels.nodes;
    // const card_id = card_data.id;
    // const card_labels = card_data.labels.nodes;

    // Indicates whether the issue in question is closed
    const closed_text = card_data.closed ? ':closed_lock_with_key:' : '';

    // TODO do not show cards that would have more than one label button highlighted aka issues with multiple triage labels
    return [
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': `${closed_text} *${card_data.repository.name}*: ${card_data.title}`,
        },
        'accessory': {
          'type': 'button',
          'text': {
            'type': 'plain_text',
            'text': 'View Issue on GitHub',
            'emoji': true,
          },
          'url': card_data.url,
          'action_id': 'link_button',
        },
      },
      {
        'type': 'section',
        'text': {
          'type': 'plain_text',
          'text': `${card_data.body} \n`,
        },
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
          'text': 'Triage this issue',
        },
      },
      // Passing in the id of the issue so that the label could be applied to said issue
      // We only want the buttons to appear if the repo has triage labels defined properly. The spread operator makes it so that nothing is added to the array if the function returns {}
      // EXTRA_TODO instead of just not returning anything, we could have a bit of text there to tell the user to create the labels on the repo
      ...external_issue_label_buttons_block(card_data.id, card_repo_triage_labels),
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

  const internal_issues_block = internal_issue_card_array.flatMap(internal_issue => {
    return [
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': `INTERNAL ISSUE: *${internal_issue.urgency}* urgency`,
        },
        'accessory': {
          'type': 'button',
          'text': {
            'type': 'plain_text',
            'text': 'View Issue',
            'emoji': true,
          },
          'url': 'https://www.github.com', // HIGH TODO link to internal issue message via chat.getPermalink
          'action_id': 'link_button',
        },
      },
      {
        'type': 'section',
        'text': {
          'type': 'plain_text',
          'text': `${internal_issue.text} \n`,
        },
      },

      {
        'type': 'section',
        // "block_id": issue_id,
        'text': {
          'type': 'mrkdwn',
          'text': 'Triage this issue',
        },
      },
      ...internal_issue_label_buttons_block(internal_issue.issue_message_ts),
      {
        'type': 'context',
        'elements': [
          {
            'type': 'mrkdwn',
            'text': 'Opened by',
          },
          // {
          //   'type': 'image',
          //   'image_url': card_data.author.avatarUrl,
          //   'alt_text': `${card_data.author.login}`,
          // },
          {
            'type': 'mrkdwn',
            'text': `*<@${internal_issue.user}>*`,
          },
        ],
      },
      {
        'type': 'divider',
      },
    ];
  });

  const combined_issues_block = external_issues_block.concat(internal_issues_block);

  return combined_issues_block;
};

/**
 * Creates the triage buttons for the Untriaged page on the app home. Uses the button value
 * to send the issue_id and label_id.
 *
 * @param {any} issue_id
 * @param {any} triage_label_array
 * @returns {any} An action block whose elements consist of the triage buttons
 */
function external_issue_label_buttons_block(issue_id, triage_label_array) {
  const labels_block =
    triage_label_array.length !== 0
      ? [
          {
            'type': 'actions',
            'elements': triage_label_array.map(label => {
              return {
                'type': 'button',
                'text': {
                  'type': 'plain_text',
                  'text': label.name,
                  'emoji': true,
                },
                'action_id': `assign_${label.name.toLowerCase()}_label`,
                'value': JSON.stringify({issue_id, label_id: label.id}),
              };
            }),
          },
        ]
      : [];
  return labels_block;
}

function internal_issue_label_buttons_block(message_ts) {
  return [
    {
      'type': 'actions',
      'elements': [
        {
          'type': 'button',
          'text': {
            'type': 'plain_text',
            'text': ':eyes: Claim this issue',
            'emoji': true,
          },
          'action_id': `assign_eyes_label`,
          'value': JSON.stringify({message_ts, name: 'eyes'}),
        },
        {
          'type': 'button',
          'text': {
            'type': 'plain_text',
            'text': ':white_check_mark: Mark as done',
            'emoji': true,
          },
          'action_id': `assign_checkmark_label`,
          'value': JSON.stringify({message_ts, name: 'white_check_mark'}),
        },
      ],
    },
  ];
}
