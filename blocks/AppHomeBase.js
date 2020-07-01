module.exports = (
  default_repo_obj,
  issue_blocks = undefined,
  more_info_blocks = undefined,
) => {
//   console.log('type of initial_repos ' + typeof initial_repos);

//   console.log(initial_repos);

  // TODO make this option its own lil block module
  const option_block = (option_text, option_val = option_text) => {
    return {
      'text': {
        'type': 'plain_text',
        'text': option_text,
        'emoji': true,
      },
      'value': option_val,
    };
  };
  // REVIEW should default option be the empty one when no options blocks are returned

//   const default_empty_repo_option = option_block(
//     'Select a repo',
//     'no_subscribed_repos',
//   );

//   const default_empty_project_option = option_block(
//     'Select a project',
//     'no_repo_selected',
//   );

//   let default_repo_option = default_empty_repo_option;

//   let default_project_option = default_empty_project_option;

  const default_repo_option_block = option_block(default_repo_obj.default_repo)
  
  console.log("default_repo_option_block", default_repo_option_block)

  // TODO add default project property to the subscribed_repo_list map object
//   const default_project_option_block = option_block(default_repo_obj.repo_default_project)

//   console.log("default_project_option_block", default_project_option_block)


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
            ...(default_repo_option_block['value'] !== '' && {'initial_option': default_repo_option_block}),
          },
          //   TODO show list of projects once a repo is selected
          {
			'type': 'external_select',
			'min_query_length': 0,
            'action_id': 'project_selection',
            'placeholder': {
              'type': 'plain_text',
              'text': 'Select a project',
                // repo_options_list.length !== 0
                //   ? 'Select a project'
                //   : 'Select repo to show projects',
              'emoji': true,
            },
            // 'options':
            //   repo_options_list.length !== 0
            //     ? project_options_list
            //     : [default_empty_project_option],
            // 'initial_option': default_project_option,
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
