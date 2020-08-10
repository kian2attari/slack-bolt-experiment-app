exports.EditTriageDutyAvailabilityModal = triage_duty_assignments_obj => {
  const {SubBlocks} = require('../index');

  return {
    'type': 'modal',
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

      ...triage_duty_assignments_obj.flatMap((assignment, index) => {
        const available_option = SubBlocks.option_obj(
          "I'm available",
          JSON.stringify({
            avail: true,
            index,
            user_id: assignment.assigned_team_member,
          })
        );

        const unavailable_option = SubBlocks.option_obj(
          "I'm unavailable",
          JSON.stringify({
            avail: false,
            index,
            user_id: assignment.assigned_team_member,
          })
        );

        return [
          {
            'type': 'input',
            'label': {
              'type': 'plain_text',
              'text': `:spiral_calendar_pad: ${assignment.date}`,
              'emoji': true,
            },
            'element': {
              'type': 'radio_buttons',
              'action_id': 'triage_duty_availability_radio',
              'initial_option': available_option,
              'options': [available_option, unavailable_option],
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
                'text': `<@${assignment.assigned_team_member}>`,
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
          //       'text': `<@${assignment.assigned_team_member}>`,
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
