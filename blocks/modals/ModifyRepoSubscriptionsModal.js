module.exports = (subscribed_repos_list = new Map()) => {
  const current_subscriptions_options = Array.from(subscribed_repos_list, repo_path => {
    return {
      'text': {
        'type': 'plain_text',
        'text': repo_path,
        'emoji': true,
      },
      'value': repo_path,
    };
  });

  const default_checkbox_option_block = {
    'text': {
      'type': 'plain_text',
      'text': 'Select this repo by default on App Home',
      'emoji': true,
    },
    'value': 'default_repo',
  };

  console.log('current_subscriptions_options', current_subscriptions_options);

  return {
    'callback_id': 'modify_repo_subscriptions',
    'type': 'modal',
    'title': {
      'type': 'plain_text',
      'text': 'Edit repo subscriptions',
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
            'Subscribe to a repo in order to manage it on Slack with GitWave and receive important notifications. \n\n Here you can *subscribe* to or *unsubscribe* from a GitHub repo.',
        },
      },
      {
        'type': 'divider',
      },
      {
        'type': 'input',
        'optional': true,
        'block_id': 'subscribe_to_repo_block',
        'element': {
          'action_id': 'subscribe_to_repo_input',
          'type': 'plain_text_input',
          'placeholder': {
            'type': 'plain_text',
            'text': 'ex: slackapi/bolt-js or git@github.com:slackapi/bolt-js.git',
            'emoji': true,
          },
        },
        'label': {
          'type': 'plain_text',
          'text': ':heavy_plus_sign:  Subscribe to a new repo',
          'emoji': true,
        },
      },
      {
        'type': 'input',
        'block_id': 'default_repo_checkbox_block',
        'optional': true,
        'element': {
          'action_id': 'default_repo_checkbox_input',
          'type': 'checkboxes',
          'options': [default_checkbox_option_block],
          // If there are no subscribed repos, precheck the "set as default" box
          ...(current_subscriptions_options.length === 0 && {
            'initial_options': [default_checkbox_option_block],
          }),
        },
        'label': {
          'type': 'plain_text',
          'text': 'Use this repo a lot?',
          'emoji': true,
        },
      },
      ...(current_subscriptions_options && current_subscriptions_options.length
        ? unsubscribe_block(current_subscriptions_options)
        : []),
    ],
  };
};

function unsubscribe_block(current_subscriptions_options) {
  return [
    {
      'type': 'input',
      'optional': true,
      'block_id': 'unsubscribe_repos_block',
      'element': {
        'action_id': 'unsubscribe_repos_input',
        'type': 'static_select',
        'placeholder': {
          'type': 'plain_text',
          'text': 'Select an existing repo subscription',
          'emoji': true,
        },
        'options': current_subscriptions_options,
      },
      'label': {
        'type': 'plain_text',
        'text': ':put_litter_in_its_place:  Unsubscribe from a repo',
        'emoji': true,
      },
    },
  ];
}
