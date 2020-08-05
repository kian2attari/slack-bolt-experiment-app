const {reg_exp} = require('../../../constants');

exports.triaged_cards = card_array => {
  const issues_block = card_array.flatMap(card => {
    const card_data = card.content;
    const repo_labels = card_data.repository.labels.nodes;
    const card_id = card_data.id;
    const card_labels = card_data.labels.nodes;

    const label_map_callback = label => {
      console.log('label', label);
      return {
        'text': {
          'type': 'plain_text',
          'text': label.name,
        },
        'value': JSON.stringify([label.id, card_id]),
      };
    };

    const non_triage_labels = label_array =>
      label_array.filter(label => !reg_exp.find_triage_labels.test(label.description));

    const label_possible_options = non_triage_labels(repo_labels).map(label_map_callback);

    console.log('card_labels', card_labels);

    const label_initial_options = non_triage_labels(card_labels).map(label_map_callback);

    // TODO do not show cards that would have more than one label button highlighted aka issues with multiple triage labels
    console.log('card_data', card_data);

    console.log('card_labels', card_labels);

    console.log('label_initial_options', label_initial_options);
    console.log('label_possible_options', label_possible_options);
    // TODO do not show cards that would have more than one label button highlighted aka issues with multiple triage labels

    return [
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': `*${card_data.title}*`,
        },
      },
      {
        'type': 'section',
        'text': {
          'type': 'plain_text',
          'text': card_data.body,
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
          'action_id': 'assign_label',
          'type': 'multi_static_select',
          'placeholder': {
            'type': 'plain_text',
            'text': 'Select a label',
          },
          'options': label_possible_options,
          // TODO Initial Options stateless transition
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
