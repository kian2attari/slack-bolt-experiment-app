module.exports = (
  initial_repos,
  issue_blocks = undefined,
  more_info_blocks = undefined,
) => {
  console.log('type of initial_repos ' + typeof initial_repos);

  console.log(initial_repos);

  let repo_options_list = [];

  const default_empty_repo_option = {
    'text': {
      'type': 'plain_text',
      'text': 'Use the GitWave shortcut',
      'emoji': true,
    },
    'value': 'no_subscribed_repos',
  };

  let default_repo_option = default_empty_repo_option;

  if (typeof initial_repos !== 'undefined') {
    initial_repos.forEach((value, key) => {
      const repo_option = {
        'text': {
          'type': 'plain_text',
          'text': value.repo_path,
          'emoji': true,
        },
        'value': value.repo_path,
      };
      if (value.is_default_repo == true) {
        default_repo_option = repo_option;
      }
      repo_options_list.push(repo_option);
    });
  }

  console.log(default_repo_option);

  console.log('repo_options_list', repo_options_list);

  if (repo_options_list.length === 1) {
    default_repo_option = repo_options_list[0];
  }

  return {
    'type': 'home',
    'blocks': [
      {
        'type': 'actions',
        'elements': [
          {
            'type': 'static_select',
            'placeholder': {
              'type': 'plain_text',
              'text':
                repo_options_list.length !== 0
                  ? 'Select a repository'
                  : 'No repo subscriptions',
              'emoji': true,
            },
            'options':
              repo_options_list.length !== 0
                ? repo_options_list
                : [default_empty_repo_option],
            // TODO add a default repo option in the ModifyRepoModal
            'initial_option': default_repo_option,
          },
        ],
      },
      {
        'type': 'divider',
      },
      // If issue blocks have been provided, render them here
      ...(typeof issue_blocks !== 'undefined' ? issue_blocks : []),

      // If the more info block has been provided, render it here
      ...(typeof more_info_blocks !== 'undefined' ? more_info_blocks : []),
    ],
  };
};
