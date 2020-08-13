exports.UsernameMapModal = (githubUsername = '') => ({
  'type': 'modal',
  'callback_id': 'map_username_modal',
  'title': {
    'type': 'plain_text',
    'text': 'Map your GitHub username',
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
          githubUsername.length !== 0
            ? `Your GitHub username is currently set to *${githubUsername}*. If you would like to change it, enter a new username below.`
            : 'Mapping your GitHub username allows GitWave to DM you whenever you are mentioned on a team GitHub repo. You have not currently set your GitHub username. Please enter it below.',
      },
    },
    {
      'type': 'divider',
    },
    {
      'type': 'input',
      'block_id': 'map_username_block',
      'label': {
        'type': 'plain_text',
        'text': 'GitHub username:',
      },
      'element': {
        'type': 'plain_text_input',
        'action_id': 'github_username_input',
        'placeholder': {
          'type': 'plain_text',
          'text': 'ex. cool-cat37',
        },
      },
    },
  ],
});
