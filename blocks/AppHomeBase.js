module.exports = (
  user_app_home_state_obj,
  issue_blocks = undefined,
  more_info_blocks = undefined
) => {
  // REVIEW should default option be the empty one when no options blocks are returned

  // // If no repos are found
  // const no_subscribed_repos_option = option_obj(
  //   'No repo subscriptions found',
  //   'no_subscribed_repos',
  // );

  // // If the repo contains no projects
  // const no_projects_option = option_obj('No projects found', 'no_projects');

  // // If the project contains no columns
  // const no_columns_option = option_obj('No columns found', 'no_columns');

  const repo_selection = user_app_home_state_obj.currently_selected_repo;

  console.log(': ------------------------------');
  console.log('user_app_home_state_obj', user_app_home_state_obj);
  console.log(': ------------------------------');

  // The block that contains the select_menu elements for filtering on the App Home page
  // If a repo hasn't been selected, it should select the no_subscribed_repos_option by default
  const selection_block = {
    'type': 'actions',
    'block_id': 'repo_proj_selection_block',
    'elements': [],
  };

  // TODO use ternary operators to cut this code down
  // Repo has been selected
  if (repo_selection.repo_path !== '' && repo_selection.repo_id !== '') {
    selection_block.elements = [
      external_select_element(
        'repo_selection',
        'Select a repository',
        option_obj(repo_selection.repo_path, repo_selection.repo_id)
      ),
    ];

    const project_selection = repo_selection.currently_selected_project || null;

    if (project_selection.project_name !== '' && project_selection.project_id !== '') {
      selection_block.elements.push(
        external_select_element(
          'project_selection',
          'Select a project',
          option_obj(project_selection.project_name, project_selection.project_id)
        )
      );
      const column_selection = project_selection.currently_selected_column || null;

      if (column_selection.column_name !== '') {
        selection_block.elements.push(
          external_select_element(
            'column_selection',
            'Select a column',
            option_obj(column_selection.column_name, column_selection.column_id)
          )
        );
      } else {
        selection_block.elements.push(
          external_select_element('column_selection', 'Select a column')
        );
      }
    } else {
      selection_block.elements.push(
        external_select_element('project_selection', 'Select a project')
      );
    }
  } else {
    // If not even a repo is selected, then just show the repo select menu with no initial option!
    selection_block.elements = [
      external_select_element('repo_selection', 'Select a repository'),
    ];
  }

  console.log('type of selection block', typeof selection_block);
  console.log('selection_block', selection_block);

  return {
    'type': 'home',
    'blocks': [
      selection_block,
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

/**
 * Returns an object for the options: or initial_option: property of a select_menu
 *
 * @param {string} option_text
 * @param {string} [option_val=option_text]
 * @returns {object} An option object
 */
function option_obj(option_text, option_val = option_text) {
  return {
    'text': {
      'type': 'plain_text',
      'text': option_text,
      'emoji': true,
    },
    'value': `${option_val}`,
  };
}

/**
 *
 *
 * @param {string} action_id
 * @param {string} place_holder_text
 * @param {object} [initial_option={}]
 * @returns {{'action_id': string, 'type': string, 'min_query_length': number, 'placeholder': object, 'initial_option': object}} Select_block_object
 */
function external_select_element(action_id, place_holder_text, initial_option = {}) {
  return {
    'action_id': action_id,
    'type': 'external_select',
    'min_query_length': 0,
    'placeholder': {
      'type': 'plain_text',
      'text': place_holder_text,
      'emoji': true,
    },
    ...(Object.keys(initial_option).length !== 0 && {
      'initial_option': initial_option,
    }),
  };
}
