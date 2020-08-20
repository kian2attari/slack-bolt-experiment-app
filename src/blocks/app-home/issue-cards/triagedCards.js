const {regExp} = require('../../../constants');
const {optionObj} = require('../../SubBlocks');

exports.triagedCards = (
  assignableTeamMembersArray,
  externalCardArray,
  internalIssueArray,
  showOnlyClaimedInternalIssues,
  showOnlyDone,
  assignedToSlackUserId
) => {
  const noAssignableTeamMemberWarningBlocks = [
    {
      'type': 'section',
      'text': {
        'type': 'mrkdwn',
        'text':
          "There are currently no assignable team members. GitWave needs to know at least one team member's GitHub username in order to assign them to issues/PR's on GitHub.",
      },
      'accessory': {
        'type': 'button',
        'text': {
          'type': 'plain_text',
          'text': 'Enter your GitHub Username',
          'emoji': true,
        },
        'action_id': 'open_map_modal_button',
      },
    },
  ];
  let noAssignableTeamMembers = false;
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

    const assignableTeamMemberOptionsArray = assignableTeamMembersArray.map(teamMember =>
      optionObj(
        `<@${teamMember.slackUserId}>`,
        JSON.stringify([cardData.id, teamMember.githubUserId])
      )
    );

    const assignedToUserObj = assignableTeamMembersArray.find(
      teamMember => teamMember.slackUserId === assignedToSlackUserId
    );

    const initialAssignableTeamMemberOptionObj = optionObj(
      `<@${assignedToSlackUserId}>`,
      JSON.stringify([cardData.id, assignedToUserObj.githubUserId])
    );

    if (assignableTeamMembersArray.length === 0) {
      noAssignableTeamMembers = true;
    }
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
          'text': cardData.body || 'No body',
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
              'block_id': cardData.id,
              'accessory': {
                'type': 'static_select',
                'placeholder': {
                  'type': 'plain_text',
                  'text': 'Select a user',
                  'emoji': true,
                },

                'options': assignableTeamMemberOptionsArray,
                ...(assignedToSlackUserId.length !== 0 && {
                  'initial_option': initialAssignableTeamMemberOptionObj,
                }),
                'action_id': 'assignable_team_members',
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
                          issueMessageTs,
                          'name': 'eyes',
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
                    issueMessageTs,
                    'name': 'white_check_mark',
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

  const combinedIssuesBlock = internalIssuesBlock.concat(
    noAssignableTeamMembers ? noAssignableTeamMemberWarningBlocks : externalIssuesBlock // If there are no assignable teammates, show that message
  );

  return combinedIssuesBlock;
};
