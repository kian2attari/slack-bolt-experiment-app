const SubBlocks = require('../SubBlocks');
// TODO remove the default value for selected_button. It's only temporarily needed for the transition to statelessness
module.exports = (
  main_level_filter_selection, // This can be a specific GitHub repo path and ID, or it can be a special selector like "all", or only "internal" and "external"
  issue_blocks = undefined,
  selected_button = 'show_untriaged_filter_button'
) => {
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

  filter_buttons_block.elements[selected_button_index].style = 'primary'; // Colors the selected button green

  // The block that contains the select_menu elements for filtering on the App Home page
  const selection_block = {
    'type': 'actions',
    'elements': [
      static_select_element(
        'main_level_filter_selection',
        'Select a scope',
        [
          {name: 'All', value: 'All'},
          {name: 'Internal', value: 'Internal'},
          {name: 'External', value: 'External'},
        ],
        {name: 'All', value: 'All'} // Note: all untriaged -> "All" for both parameters
      ),
    ],
  };

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
};

// TODO the initial option should be gotten from the previous state of the view

function static_select_element(
  action_id,
  place_holder_text,
  options,
  initial_option = {}
) {
  return {
    'action_id': action_id,
    'type': 'static_select',
    'placeholder': {
      'type': 'plain_text',
      'text': place_holder_text,
      'emoji': true,
    },
    'options': options.map(option => SubBlocks.option_obj(option.name, option.value)),
    ...(Object.keys(initial_option).length !== 0 && {
      'initial_option': SubBlocks.option_obj(initial_option.name, initial_option.value),
    }),
  };
}
