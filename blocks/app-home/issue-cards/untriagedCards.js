exports.untriaged_cards = card_array => {
  /* TODO change this so that the triage labels are generated dynamically for each repo and saved as part of repo props
  when first getting label data. The app would know which labels are triage as their descriptions will start with TRIAGE: */
  const label_buttons_block = {
    'type': 'actions',
    'elements': [
      {
        'type': 'button',
        'text': {
          'type': 'plain_text',
          'text': 'Bug',
          'emoji': true,
        },
        'action_id': 'assign_bug_label',
        'value': 'untriaged',
      },
      {
        'type': 'button',
        'text': {
          'type': 'plain_text',
          'text': 'Discussion',
          'emoji': true,
        },
        'action_id': 'assign_discussion_label',
        'value': 'discussion',
      },
      {
        'type': 'button',
        'text': {
          'type': 'plain_text',
          'text': 'Docs',
          'emoji': true,
        },
        'action_id': 'assign_docs_label',
        'value': 'docs',
      },
      {
        'type': 'button',
        'text': {
          'type': 'plain_text',
          'text': 'Enhancement',
          'emoji': true,
        },
        'action_id': 'assign_enhancement_label',
        'value': 'enhancement',
      },
      {
        'type': 'button',
        'text': {
          'type': 'plain_text',
          'text': 'Question',
          'emoji': true,
        },
        'action_id': 'assign_question_label',
        'value': 'question',
      },
      {
        'type': 'button',
        'text': {
          'type': 'plain_text',
          'text': 'Tests',
          'emoji': true,
        },
        'action_id': 'assign_test_label',
        'value': 'tests',
      },
    ],
  };

  const issues_block = card_array.flatMap(card => {
    const card_data = card.content;
    // const card_id = card_data.id;
    const card_labels = card_data.labels.nodes;
    // The labels that the issues already have selected
    // const label_initial_options = card_labels.map(label => {
    //   return {
    //     'text': {
    //       'type': 'plain_text',
    //       'text': label.name,
    //     },
    //     'value': card_id,
    //   };
    // });

    console.log('card_data', card_data);

    console.log('card_labels', card_labels);

    // console.log('label_initial_options', label_initial_options);
    // TODO show repo name/whether it's internal and from who it is
    // TODO add the triage label buttons
    // TODO do not show cards that would have more than one label button highlighted aka issues with multiple triage labels
    // TODO if the issue is closed, then change somthing about visually to indicate the status

    return [
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': `*${card_data.repository.name}*: ${card_data.title} \n ${card_data.body}`,
        },
        'accessory': {
          'type': 'button',
          'text': {
            'type': 'plain_text',
            'text': 'View Issue',
            'emoji': true,
          },
          'url': card_data.url,
          'action_id': 'link_button',
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
      label_buttons_block,
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
