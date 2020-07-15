module.exports = (user_id, subscribed_repo_path) => {
  return [
    {
      'type': 'section',
      'text': {
        'type': 'mrkdwn',
        'text': `Hey <@${user_id}>!, you've successfully subscribed to *${subscribed_repo_path}*. Make sure you set up the *New Issue defaults* for this repo using the global shortcut so that I can automatically assign newly-created issues to a project and column of your choice as soon as they are created!`,
      },
    },
    {
      'type': 'actions',
      'elements': [
        {
          'type': 'button',
          'text': {
            'type': 'plain_text',
            'text': 'Setup rules for new issues',
            'emoji': true,
          },
          'value': subscribed_repo_path,
          'action_id': 'open_set_repo_defaults_modal_button',
        },
      ],
    },
  ];
};
