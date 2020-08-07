exports.EditTriageDutyAvailabilityModal = triage_duty_assignments_obj => ({
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

    ...triage_duty_assignments_obj.flatMap((assignment, index) => [
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': assignment.date,
        },
        'accessory': {
          'type': 'button',
          'style': 'danger',
          'text': {
            'type': 'plain_text',
            'text': "I'm Unavailable",
            'emoji': true,
          },
          'value': JSON.stringify({
            index,
            user_id: assignment.assigned_team_member,
          }),
        },
      },
      {
        'type': 'context',
        'elements': [
          {
            'type': 'mrkdwn',
            'text': index === 0 ? '*Currently assigned*' : 'Set to be assigned:',
          },
          // {
          //   'type': 'image',
          //   'image_url':
          //     'https://link_to_their_profile_pic',
          //   'alt_text': 'FirstName LastName',
          // },
          {
            'type': 'mrkdwn',
            'text': `<@${assignment.assigned_team_member}>`,
          },
        ],
      },
      ...(index !== 3
        ? [
            {
              'type': 'divider',
            },
          ]
        : []),
      // ...(index === 0
      //   ? [
      //       {
      //         'type': 'divider',
      //       },
      //     ]
      //   : []),
    ]),
  ],
});
