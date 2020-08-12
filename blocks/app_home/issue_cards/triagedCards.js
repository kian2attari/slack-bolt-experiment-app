const {regExp} = require('../../../constants');

exports.triagedCards = (
  externalCardArray,
  internalIssueArray,
  showOnlyClaimedInternalIssues,
  showOnlyDone
) => {
  const externalIssuesBlock = externalCardArray.flatMap(card => {
    const cardData = card.content;
    const repoLabels = cardData.repository.labels.nodes;
    const cardId = cardData.id;
    const cardLabels = cardData.labels.nodes;

    const labelMapCallback = label => {
      return {
        'text': {
          'type': 'plain_text',
          'text': label.name,
        },
        'value': JSON.stringify([label.id, cardId]),
      };
    };

    const nonTriageLabels = labelArray =>
      labelArray.filter(label => !regExp.findTriageLabels.test(label.description));

    const labelPossibleOptions = nonTriageLabels(repoLabels).map(labelMapCallback);

    const labelInitialOptions = nonTriageLabels(cardLabels).map(labelMapCallback);

    // TODO do not show cards that would have more than one label button highlighted aka issues with multiple triage labels

    // TODO do not show cards that would have more than one label button highlighted aka issues with multiple triage labels

    return [
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': `*${cardData.title}*`,
        },
        'accessory': {
          'type': 'button',
          'text': {
            'type': 'plain_text',
            'text': 'View Issue on GitHub',
            'emoji': true,
          },
          'url': cardData.url,
          'action_id': 'link_button',
        },
      },
      {
        'type': 'section',
        'text': {
          'type': 'plain_text',
          'text': cardData.body,
        },
      },
      ...(showOnlyDone
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
                'options': labelPossibleOptions,
                // TODO Initial Options stateless transition
                ...(labelInitialOptions.length !== 0 && {
                  'initial_options': labelInitialOptions,
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
                'type': 'external_select',
                'placeholder': {
                  'type': 'plain_text',
                  'text': 'Select a user',
                  'emoji': true,
                },
                'action_id': 'assignable_team_members',
                'min_query_length': 0,
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
            'image_url': cardData.author.avatarUrl,
            'alt_text': `${cardData.author.login}`,
          },
          {
            'type': 'mrkdwn',
            'text': `*${cardData.author.login}*`,
          },
        ],
      },
      {
        'type': 'divider',
      },
    ];
  });

  const internalIssuesBlock = internalIssueArray.flatMap(internalIssue => {
    const {urgency, text, deepLinkToMessage, issueMessageTs, user} = internalIssue;
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
          'url': deepLinkToMessage,
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
      ...(showOnlyDone
        ? []
        : [
            {
              'type': 'actions',
              'elements': [
                ...(showOnlyClaimedInternalIssues
                  ? []
                  : [
                      {
                        'type': 'button',
                        'text': {
                          'type': 'plain_text',
                          'text': ':eyes: Claim this issue',
                          'emoji': true,
                        },
                        'action_id': `assign_eyes_label`,
                        'value': JSON.stringify({
                          issue_message_ts: issueMessageTs,
                          name: 'eyes',
                        }),
                      },
                    ]),
                {
                  'type': 'button',
                  'text': {
                    'type': 'plain_text',
                    'text': ':white_check_mark: Mark as done',
                    'emoji': true,
                  },
                  'action_id': `assign_checkmark_label`,
                  'value': JSON.stringify({
                    issue_message_ts: issueMessageTs,
                    name: 'white_check_mark',
                  }),
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

  console.log('external_issues_block', externalIssuesBlock);
  const combinedIssuesBlock = internalIssuesBlock.concat(externalIssuesBlock);

  return combinedIssuesBlock;
};
