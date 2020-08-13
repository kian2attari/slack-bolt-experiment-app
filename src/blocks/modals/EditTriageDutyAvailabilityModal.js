exports.EditTriageDutyAvailabilityModal = triageDutyAssignmentsObj => {
  const {SubBlocks} = require('../index');
  const {dateFormatter} = require('../../helper-functions');

  return {
    'type': 'modal',
    'callback_id': 'edit_triage_duty_availability_modal',
    'title': {
      'type': 'plain_text',
      'text': 'Triage duty availability',
      'emoji': true,
    },
    'submit': {
      'type': 'plain_text',
      'text': 'Submit',
      'emoji': true,
    },
    'close': {
      'type': 'plain_text',
      'text': 'Cancel',
      'emoji': true,
    },
    'blocks': [
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text':
            'Here you can edit the weeks that you are unavailable for triage duty.\n\n *Please indicate any weeks you are unavailable below:*\n',
        },
      },

      ...triageDutyAssignmentsObj.flatMap((assignment, index) => {
        const availableOption = SubBlocks.optionObj(
          "I'm available",
          JSON.stringify({
            avail: true,
            index,
            userId: assignment.assignedTeamMember,
          })
        );

        const unavailableOption = SubBlocks.optionObj(
          "I'm unavailable",
          JSON.stringify({
            avail: false,
            index,
            userId: assignment.assignedTeamMember,
          })
        );

        return [
          {
            'type': 'input',
            'label': {
              'type': 'plain_text',
              'text': `:spiral_calendar_pad: ${dateFormatter(new Date(assignment.date))}`,
              'emoji': true,
            },
            'element': {
              'type': 'radio_buttons',
              'action_id': 'triage_duty_availability_radio',
              'initial_option': availableOption,
              'options': [availableOption, unavailableOption],
            },
          },
          {
            'type': 'section',
            'fields': [
              {
                'type': 'mrkdwn',
                'text': index === 0 ? '*Currently assigned:*' : 'Set to be assigned:',
              },
              {
                'type': 'mrkdwn',
                'text': `<@${assignment.assignedTeamMember}>`,
              },
            ],
          },
          // {
          //   'type': 'context',
          //   'elements': [
          //     {
          //       'type': 'mrkdwn',
          //       'text': index === 0 ? '*Currently assigned*' : 'Set to be assigned:',
          //     },
          //     // {
          //     //   'type': 'image',
          //     //   'image_url':
          //     //     'https://link_to_their_profile_pic',
          //     //   'alt_text': 'FirstName LastName',
          //     // },
          //     {
          //       'type': 'mrkdwn',
          //       'text': `<@${assignment.assignedTeamMember}>`,
          //     },
          //   ],
          // },
          ...(index !== 3
            ? [
                {
                  'type': 'divider',
                },
              ]
            : []),
        ];
      }),
    ],
  };
};
