module.exports = (subscribed_repos_list = new Map()) => {
  const current_subscriptions_sub_blocks = Array.from(
    subscribed_repos_list,
    repo_path => {
      return {
        'type': 'plain_text',
        'text': `*${repo_path}*`,
        'emoji': true,
      };
    }
  );

  console.log('current_subscriptions_sub_blocks', current_subscriptions_sub_blocks);

  return {
    'callback_id': 'add_repo_subscriptions',
    'type': 'modal',
    'title': {
      'type': 'plain_text',
      'text': 'Add repo subscriptions',
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
            'Subscribe to a repo in order to manage it on Slack with GitWave and receive important notifications. \n\n Here you can *subscribe* from a GitHub repo.',
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
      ...(current_subscriptions_sub_blocks && current_subscriptions_sub_blocks.length
        ? current_subscriptions_block(current_subscriptions_sub_blocks)
        : []),
    ],
  };
};

function current_subscriptions_block(current_subscriptions_sub_blocks) {
  return [
    {
      'type': 'section',
      'fields': current_subscriptions_sub_blocks,
    },
  ];
}
