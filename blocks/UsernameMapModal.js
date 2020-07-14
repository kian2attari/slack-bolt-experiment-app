module.exports = {
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
      'type': 'input',
      'block_id': 'map_username_block',
      'label': {
        'type': 'plain_text',
        'text':
          'Mapping your GitHub username allows GitWave to DM you whenever you are mentioned on a team GitHub repo',
      },
      'element': {
        'type': 'plain_text_input',
        'action_id': 'github_username_input',
        'placeholder': {
          'type': 'plain_text',
          'text': 'GitHub username',
        },
      },
    },
  ],
};
