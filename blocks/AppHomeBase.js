module.exports = (
  user_repo_subscriptions_obj,
  issue_blocks = undefined,
  more_info_blocks = undefined,
) => {
  // TODO make this option its own lil block module
  const option_block = (option_text, option_val = option_text) => {
    return {
      'text': {
        'type': 'plain_text',
        'text': option_text,
        'emoji': true,
      },
      'value': `${option_val}`,
    };
  };

  // REVIEW should default option be the empty one when no options blocks are returned

  const default_empty_project_option = option_block(
    'Select a repo first!',
    'no_repo_selected',
  );

  const default_repo_option_block = option_block(
    user_repo_subscriptions_obj.default_repo
  );

  console.log('default_repo_option_block', default_repo_option_block);

  let project_option_block_list = [];

  const selected_repo_path =
    user_repo_subscriptions_obj.currently_selected_repo;

  const selected_repo_obj =
    selected_repo_path !== ''
      ? user_repo_subscriptions_obj.subscribed_repo_map.get(selected_repo_path)
      : null;

  if (selected_repo_obj !== null) {
    project_option_block_list = selected_repo_obj.repo_project_list.map(
      project => {
        return option_block(project.project_name, project.project_number);
      },
    );

    console.log('project_option_block_list', project_option_block_list);
    console.log(
      'project_option_block_list length',
      project_option_block_list.length,
    );
  }

  const selected_repo_option_block = option_block(selected_repo_path);

  /* How initial_option works: If a repo hasn't been selected but a default repo is defined,
  the default repo should be the initial option. If a repo has been selected, that will be the
  initial option */
  let initial_option_block_repo;
   // TODO if only one repo is subscribed, it must be the default
  if (selected_repo_obj !== null) {
	initial_option_block_repo = selected_repo_option_block
  }

  else {
	initial_option_block_repo = default_repo_option_block
  }
	
  console.log('initial_option_block_repo', initial_option_block_repo)

  const option_blocks_project =
    project_option_block_list.length !== 0
      ? project_option_block_list
      : [default_empty_project_option];

  console.log('option_blocks_project', option_blocks_project);

  const project_select_block = {
    'type': 'static_select',
    'action_id': 'project_selection',
    'placeholder': {
      'type': 'plain_text',
      'text': 'Select a project',
      'emoji': true,
    },
    'options': option_blocks_project,
    // TODO picking default projects
    // 'initial_option': initial_option_block_project,
  };

  return {
    'type': 'home',
    'blocks': [
      {
        'type': 'actions',
        'block_id': 'repo_proj_selection_block',
        'elements': [
          {
            'action_id': 'repo_selection',
            'type': 'external_select',
            'min_query_length': 0,
            'placeholder': {
              'type': 'plain_text',
              'text': 'Select a repository',
              'emoji': true,
            },
            // If no default repo has been specified, don't select an initial value
            ...(default_repo_option_block['value'] !== '' && {
              'initial_option': initial_option_block_repo,
            }),
          },
          //   TODO Don't show the project select_menu until a repo selected
          ...(selected_repo_obj !== null ? [project_select_block] : []),
        ],
      },
      {
        'type': 'divider',
	  },
	  // TODO if project has no issues, render nothing
      // If issue blocks have been provided, render them here
      ...(typeof issue_blocks !== 'undefined' ? issue_blocks : []),

      // If the more info block has been provided, render it here
      ...(typeof more_info_blocks !== 'undefined' ? more_info_blocks : []),
    ],
  };
};
