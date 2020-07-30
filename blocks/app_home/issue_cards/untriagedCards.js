exports.untriaged_cards = card_array => {
  const issues_block = card_array.flatMap(card => {
    const card_data = card.content;
    const card_repo_triage_labels = card_data.repository.labels.nodes;
    // const card_id = card_data.id;
    // const card_labels = card_data.labels.nodes;

    // Indicates whether the issue in question is closed
    const starting_card_text = card_data.closed
      ? `**CLOSED** ${card_data.repository.name}:`
      : `*${card_data.repository.name}*:`;

    // TODO do not show cards that would have more than one label button highlighted aka issues with multiple triage labels
    return [
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': `${starting_card_text} ${card_data.title}`,
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
      ...label_buttons_block(card_data.id, card_repo_triage_labels),
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

/**
 * Creates the triage buttons for the Untriaged page on the app home. Uses the button value
 * to send the issue_id and label_id.
 *
 * @param {any} issue_id
 * @param {any} triage_label_array
 * @returns {any} An action block whose elements consist of the triage buttons
 */
function label_buttons_block(issue_id, triage_label_array) {
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
