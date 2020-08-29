const {trimString} = require('./trimString');

function untriagedCards({externalIssueCardArray, internalIssueCardArray}) {
  // FlatMap is only available in Node 11+
  const externalIssuesBlock = externalIssueCardArray.flatMap(card => {
    const cardData = card.content;
    const cardRepoTriageLabels = cardData.repository.labels.nodes;
    // const card_id = card_data.id;
    // const card_labels = card_data.labels.nodes;

    // Indicates whether the issue in question is closed
    const closedText = cardData.closed ? ':closed_lock_with_key:' : '';

    const issueOrPr = typeof cardData.mergeable !== 'undefined' ? 'PR' : 'Issue';

    // TODO do not show cards that would have more than one label button highlighted aka issues with multiple triage labels
    return [
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': `${closedText} *${issueOrPr}* in *${cardData.repository.name}*: ${cardData.title}`,
        },
        'accessory': {
          'type': 'button',
          'text': {
            'type': 'plain_text',
            'text': `View ${issueOrPr} on GitHub`,
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
          'text': `${trimString(cardData.body, 2500) || 'No body'} \n`,
        },
      },
      /* The GitHub GraphQL API needs both the issue ID and 
              the label id to assign a label. The block_id is set as 
              the id of the issue so that the unique issue id is sent over 
              with the label id when a label is selected. */

      {
        'type': 'section',
        // "block_id": issueId,
        'text': {
          'type': 'mrkdwn',
          'text': `Triage this ${issueOrPr}`,
        },
      },
      // Passing in the id of the issue so that the label could be applied to said issue
      // We only want the buttons to appear if the repo has triage labels defined properly. The spread operator makes it so that nothing is added to the array if the function returns {}
      // EXTRA_TODO instead of just not returning anything, we could have a bit of text there to tell the user to create the labels on the repo
      ...externalIssueLabelButtonsBlock(cardData.id, cardRepoTriageLabels),
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

  const internalIssuesBlock = internalIssueCardArray.flatMap(internalIssue => [
    {
      'type': 'section',
      'text': {
        'type': 'mrkdwn',
        'text': `*Internal Issue*: ${internalIssue.urgency.toUpperCase()} urgency`,
      },
      'accessory': {
        'type': 'button',
        'text': {
          'type': 'plain_text',
          'text': 'View Issue',
          'emoji': true,
        },
        'url': internalIssue.deepLinkToMessage,
        'action_id': 'link_button',
      },
    },
    {
      'type': 'section',
      'text': {
        'type': 'plain_text',
        'text': `${internalIssue.text} \n`,
      },
    },

    {
      'type': 'section',
      // "block_id": issueId,
      'text': {
        'type': 'mrkdwn',
        'text': 'Triage this issue',
      },
    },
    ...internalIssueLabelButtonsBlock(internalIssue.issueMessageTs),
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
          'text': `*<@${internalIssue.user}>*`,
        },
      ],
    },
    {
      'type': 'divider',
    },
  ]);

  const combinedIssuesBlock = internalIssuesBlock.concat(externalIssuesBlock);

  return combinedIssuesBlock;
}

/**
 * Creates the triage buttons for the Untriaged page on the app home. Uses the button value
 * to send the issueId and label_id.
 *
 * @param {any} issueId
 * @param {any} triage_label_array
 * @returns {any} An action block whose elements consist of the triage buttons
 */
function externalIssueLabelButtonsBlock(issueId, triageLabelArray) {
  const labelsBlock =
    triageLabelArray.length !== 0
      ? [
          {
            'type': 'actions',
            'elements': triageLabelArray.map(label => {
              return {
                'type': 'button',
                'text': {
                  'type': 'plain_text',
                  'text': label.name,
                  'emoji': true,
                },
                'action_id': `assign_${label.name.toLowerCase()}_label`,
                'value': JSON.stringify({issueId, labelId: label.id}),
              };
            }),
          },
        ]
      : [];
  return labelsBlock;
}

function internalIssueLabelButtonsBlock(issueMessageTs) {
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
          'value': JSON.stringify({issueMessageTs, name: 'eyes'}),
        },
        {
          'type': 'button',
          'text': {
            'type': 'plain_text',
            'text': ':white_check_mark: Mark as done',
            'emoji': true,
          },
          'action_id': `assign_checkmark_label`,
          'value': JSON.stringify({issueMessageTs, name: 'white_check_mark'}),
        },
      ],
    },
  ];
}

exports.untriagedCards = untriagedCards;
