module.exports = (
  initial_repos,
  issue_blocks = undefined,
  more_info_blocks = undefined,
) => {
  console.log('type of initial_repos ' + typeof initial_repos);

  console.log(initial_repos);

  // TODO make this option its own lil block module
  const option_obj = (option_text, option_val = option_text) => {
    return {
      'text': {
        'type': 'plain_text',
        'text': option_text,
        'emoji': true,
      },
      'value': option_val,
    };
  };

  const default_empty_repo_option = option_obj(
    'Select a repo',
    'no_subscribed_repos',
  );

  const default_empty_project_option = option_obj(
    'Select a project',
    'no_repo_selected',
  );

  let default_repo_option = default_empty_repo_option;

  let default_project_option = default_empty_project_option;

  let repo_options_list = [];

  // TODO move this over to the AppHomeBase
  let project_options_list = [];
  
  // Generate the option objects if repos are provided
  if (initial_repos.size !== 0) {
    initial_repos.forEach((value, key) => {
      const repo_option_block = option_obj(key);
      if (value.is_default_repo == true) {
        default_repo_option = repo_option_block;
      }
      repo_options_list.push(repo_option_block);
	});
	const default_repo_name = default_repo_option['value']
	console.log(default_repo_name)
	const default_repo_obj = initial_repos.get(default_repo_name)
	console.log("default_repo_obj", default_repo_obj)
	
    // Grab the projects and turn them into options
    project_options_list = default_repo_obj.repo_project_list.map(
      project => {
		let option_obj = {
			text: {
			  type: 'plain_text',
			  text: project.project_name,
			},
			value: `${project.project_number}`,
		  }
        console.log("option_obj", option_obj)
		
        return option_obj;
      },
    );
  }

  // TODO This should be taken care of in the subscription
  if (repo_options_list.length === 1) {
    default_repo_option = repo_options_list[0];
  }


  console.log('project_options_list', project_options_list);

  // TODO this is a test, you should actually show the default project
  default_project_option = project_options_list[0];

  console.log('default_repo_option', default_repo_option);

  console.log('default_project_option', default_project_option);

  console.log('repo_options_list', repo_options_list);

  return {
    'type': 'home',
    'blocks': [
      {
        'type': 'actions',
        'block_id': 'repo_proj_selection_block',
        'elements': [
          {
            'action_id': 'repo_selection',
            'type': 'static_select',
            'placeholder': {
              'type': 'plain_text',
              'text':
                repo_options_list.length !== 0
                  ? 'Select a repository'
                  : 'No subscribed repos found',
              'emoji': true,
            },
            'options':
              repo_options_list.length !== 0
                ? repo_options_list
                : [default_empty_repo_option],
            'initial_option': default_repo_option,
          },
          //   TODO show list of projects once a repo is selected
          {
            'type': 'static_select',
            'action_id': 'project_selection',
            'placeholder': {
              'type': 'plain_text',
              'text':
                repo_options_list.length !== 0
                  ? 'Select a project'
                  : 'Select repo to show projects',
              'emoji': true,
            },
            'options':
              repo_options_list.length !== 0
                ? project_options_list
                : [default_empty_project_option],
            'initial_option': default_project_option,
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
