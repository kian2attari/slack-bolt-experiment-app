module.exports = (user_id, added_through_setup = true) => {
  return [
    {
      'type': 'section',
      'text': {
        'type': 'mrkdwn',
        'text':
          `Hey <@${user_id}>! ` +
          (added_through_setup
            ? "You've been added to the triage team on GitWave."
            : '') +
          " I'm a Slack app that helps you triage issues on your repos right from Slack. \n \n Please click on the button below provide your GitHub username so that I can DM you whenever you are mentioned (@'ed) by someone on your GitHub repos.",
      },
    },
    {
      'type': 'actions',
      'elements': [
        {
          'type': 'button',
          'text': {
            'type': 'plain_text',
            'text': 'Enter GitHub username',
            'emoji': true,
          },
          'value': user_id,
          'action_id': 'button_open_map_modal',
        },
      ],
    },
  ];
};
