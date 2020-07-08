module.exports = (
  user_repo_subscriptions_obj,
  user_subscribed_repos_obj,
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

  // TODO change the static select for project to a external select that loads after repo pick

  // TODO either also change the column select to an external select or change it to row of buttons a la gcal

  const static_select_block = (action_id, place_holder_text, option_blocks) => {
    return {
      'type': 'static_select',
      'action_id': action_id,
      'placeholder': {
        'type': 'plain_text',
        'text': place_holder_text,
        'emoji': true,
      },
      'options': option_blocks,
    };
  };

  // REVIEW should default option be the empty one when no options blocks are returned

  // If no repo has been selected
  const default_repo_option_block = option_block(
    user_subscribed_repos_obj.default_repo,
  );

  // If the repo contains no projects
  const default_empty_project_option = option_block(
    'Select a repo first!',
    'no_repo_selected',
  );

  // If the project contains no columns
  const default_empty_column_option = option_block(
    'No columns found',
    'no_columns_selected',
  );

  console.log('default_repo_option_block', default_repo_option_block);

  let project_option_block_list = [];

  let column_option_block_list = [];

  const selected_repo_path =
    user_repo_subscriptions_obj.currently_selected_repo;

  const selected_repo_obj =
    selected_repo_path !== ''
      ? user_subscribed_repos_obj.subscribed_repo_map.get(selected_repo_path)
      : null;

  const selected_proj_num =
    user_repo_subscriptions_obj.currently_selected_project.number !== 0
      ? user_repo_subscriptions_obj.currently_selected_project.number
      : null;

  console.log('selected_proj_num', selected_proj_num);

  if (selected_repo_obj !== null) {
    project_option_block_list = selected_repo_obj.repo_project_list.map(
      project => {
        return option_block(project.project_name, project.project_number);
      },
    );

    column_option_block_list = user_repo_subscriptions_obj.currently_selected_project.columns.map(
      column => {
        return option_block(column.name, column.id);
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
  let initial_repo_options_block;
  // TODO if only one repo is subscribed, it must be the default
  if (selected_repo_obj !== null) {
    initial_repo_options_block = selected_repo_option_block;
  } else {
    initial_repo_options_block = default_repo_option_block;
  }

  console.log('initial_repo_options_block', initial_repo_options_block);

  const project_options_blocks =
    project_option_block_list.length !== 0
      ? project_option_block_list
      : [default_empty_project_option];

  const column_options_blocks =
    column_option_block_list.length !== 0
      ? column_option_block_list
      : [default_empty_column_option];

  console.log('project_options_blocks', project_options_blocks);

  const project_select_block = static_select_block(
    'project_selection',
    'Select a project',
    project_options_blocks,
  );

  const column_select_block = static_select_block(
    'column_selection',
    'Select a column',
    column_options_blocks,
  );

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
              'initial_option': initial_repo_options_block,
            }),
          },
          ...(selected_repo_obj !== null ? [project_select_block] : []),
          //   TODO Don't show the project select_menu until a repo selected
          ...(selected_proj_num !== null ? [column_select_block] : []),
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
