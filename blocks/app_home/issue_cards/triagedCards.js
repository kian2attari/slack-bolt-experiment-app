const {reg_exp} = require('../../../constants');

exports.triaged_cards = (
  external_card_array,
  internal_issue_array,
  show_only_done = false
) => {
  const external_issues_block = external_card_array.flatMap(card => {
    const card_data = card.content;
    const repo_labels = card_data.repository.labels.nodes;
    const card_id = card_data.id;
    const card_labels = card_data.labels.nodes;

    const label_map_callback = label => {
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

    const label_initial_options = non_triage_labels(card_labels).map(label_map_callback);

    // TODO do not show cards that would have more than one label button highlighted aka issues with multiple triage labels

    // TODO do not show cards that would have more than one label button highlighted aka issues with multiple triage labels

    return [
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': `*${card_data.title}*`,
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
          'text': card_data.body,
        },
      },
      ...(show_only_done
        ? []
        : [
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
          ]),
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

  const internal_issues_block = internal_issue_array.flatMap(internal_issue => {
    const {urgency, text, deep_link_to_message, issue_message_ts, user} = internal_issue;
    return [
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': `INTERNAL ISSUE: *${urgency}* urgency`,
        },
        'accessory': {
          'type': 'button',
          'text': {
            'type': 'plain_text',
            'text': 'View Original Message',
            'emoji': true,
          },
          'url': deep_link_to_message,
          'action_id': 'link_button',
        },
      },
      {
        'type': 'section',
        'text': {
          'type': 'plain_text',
          'text': `${text} \n \n`,
        },
      },
      ...(show_only_done
        ? []
        : [
            {
              'type': 'actions',
              'elements': [
                {
                  'type': 'button',
                  'text': {
                    'type': 'plain_text',
                    'text': ':white_check_mark: Mark as done',
                    'emoji': true,
                  },
                  'action_id': `assign_checkmark_label`,
                  'value': JSON.stringify({issue_message_ts, name: 'white_check_mark'}),
                },
              ],
            },
          ]),
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
            'text': `*<@${user}>*`,
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
