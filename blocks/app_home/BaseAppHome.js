const SubBlocks = require('../SubBlocks');
// TODO remove the default value for selected_button. It's only temporarily needed for the transition to statelessness
module.exports = (
  repo_obj,
  issue_blocks = undefined,
  selected_button = 'show_untriaged_filter_button'
) => {
  // This can be a specific GitHub repo, or it can be a special selector like "all untriaged", and possibly "internal issues" and "external issues"
  const repo_selection = repo_obj.currently_selected_repo;

  // TODO the primary style should be applied to whatever button was specified in selected_button_parameter
  const filter_buttons_block = {
    'type': 'actions',
    'elements': [
      {
        'type': 'button',
        'text': {
          'type': 'plain_text',
          'text': 'Untriaged',
          'emoji': true,
        },
        'action_id': 'show_untriaged_filter_button',
        'value': 'untriaged',
      },
      {
        'type': 'button',
        'text': {
          'type': 'plain_text',
          'text': 'Up for grabs',
          'emoji': true,
        },
        'action_id': 'show_up_for_grabs_filter_button',
        'value': 'up_for_grabs',
      },
      {
        'type': 'button',
        'text': {
          'type': 'plain_text',
          'text': 'Assigned to me',
          'emoji': true,
        },
        'action_id': 'show_assigned_to_user_filter_button',
        'value': 'assigned_to_me',
      },
      {
        'type': 'button',
        'text': {
          'type': 'plain_text',
          'text': 'Done by me',
          'emoji': true,
        },
        'action_id': 'show_done_by_user_filter_button',
        'value': 'done_by_me',
      },
    ],
  };

  const selected_button_index = filter_buttons_block.elements.findIndex(
    button => button.action_id === selected_button
  );

  filter_buttons_block.elements[selected_button_index].style = 'primary';

  // The block that contains the select_menu elements for filtering on the App Home page
  // If a repo hasn't been selected, it should select the no_subscribed_repos_option by default
  const selection_block = {
    'type': 'actions',
    'block_id': 'repo_proj_selection_block',
    'elements': [],
  };

  selection_block.elements = [
    external_select_element(
      'main_level_filter_selection',
      'Select a repository',
      SubBlocks.option_obj(repo_selection.repo_path, repo_selection.repo_id)
    ),
  ];

  // A special selection was made!
  if (repo_selection.repo_path === 'All Untriaged') {
    // Show all untriaged by default
    return {
      'type': 'home',
      'blocks': [
        selection_block,
        filter_buttons_block,
        {
          'type': 'divider',
        },
        // TODO if project has no issues, render nothing
        // If issue blocks have been provided, render them here
        ...(typeof issue_blocks !== 'undefined' ? issue_blocks : []),

        // If the more info block has been provided, render it here
        // ...(typeof more_info_blocks !== 'undefined' ? more_info_blocks : []),
      ],
    };
  }

  const project_selection = repo_selection.currently_selected_project || null;
  // TODO this project selection level is only relevant if a repo is picked in the repo selector, so not when "untriaged", "internal", or "external", is picked
  if (project_selection.project_name !== '' && project_selection.project_id !== '') {
    selection_block.elements.push(
      external_select_element(
        'project_selection',
        'Select a project',
        SubBlocks.option_obj(project_selection.project_name, project_selection.project_id)
      )
    );
    const column_selection = project_selection.currently_selected_column || null;

    if (column_selection.column_name !== '') {
      selection_block.elements.push(
        external_select_element(
          'column_selection',
          'Select a column',
          SubBlocks.option_obj(column_selection.column_name, column_selection.column_id)
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

  console.log('post repo check type of selection block', typeof selection_block);
  console.log('post repo check selection_block', selection_block);

  return {
    'type': 'home',
    'blocks': [
      selection_block,
      // TODO adjust the filter buttons to work here too, potentially. I'd need to turn the filter_buttons_block into a function
      // filter_buttons_block,
      {
        'type': 'divider',
      },
      // TODO if project has no issues, render nothing
      // If issue blocks have been provided, render them here
      ...(typeof issue_blocks !== 'undefined' ? issue_blocks : []),

      // If the more info block has been provided, render it here
      // ...(typeof more_info_blocks !== 'undefined' ? more_info_blocks : []),
    ],
  };
};

// TODO the initial option should be gotten from the previous state of the view
/**
 * @param {string} action_id
 * @param {string} place_holder_text
 * @param {object} [initial_option] Default is `{}`
 * @returns {{
 *   'action_id': string;
 *   'type': string;
 *   'min_query_length': number;
 *   'placeholder': object;
 *   'initial_option': object;
 * }} Select_block_object
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