const SubBlocks = require('../SubBlocks');

module.exports = (
  mainLevelFilterSelection = 'All', // This can be "all", or only "internal" and "external"
  issueBlocks = undefined,
  selectedButton = 'show_untriaged_filter_button'
) => {
  const filterButtonsBlock = {
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

  const selectedButtonIndex = filterButtonsBlock.elements.findIndex(
    button => button.action_id === selectedButton
  );

  filterButtonsBlock.elements[selectedButtonIndex].style = 'primary'; // Colors the selected button green

  // The block that contains the select_menu elements for filtering on the App Home page
  // const selectionBlock = {
  //   'type': 'actions',
  //   'elements': [
  //     staticSelectElement(
  //       'main_level_filter_selection',
  //       'Select a scope',
  //       [
  //         {name: 'All', value: 'All'},
  //         {name: 'Internal', value: 'Internal'},
  //         {name: 'External', value: 'External'},
  //       ],
  //       {name: mainLevelFilterSelection, value: mainLevelFilterSelection} // Note: all untriaged -> "All" for both parameters
  //     ),
  //   ],
  // };

  return {
    'type': 'home',
    'blocks':
      mainLevelFilterSelection !== 'NoTeam'
        ? [
            // selectionBlock, // TODO uncomment this when mainLevelFilterSelection.js is complete
            filterButtonsBlock,
            {
              'type': 'divider',
            },
            // If issue blocks have been provided, render them here
            ...(typeof issueBlocks !== 'undefined' ? issueBlocks : []),
          ]
        : [
            {
              'type': 'section',
              'text': {
                'type': 'mrkdwn',
                'text':
                  "Welcome to GitWave, your all-in-one triaging assistant! Looks like you're not part of a traige team yet. Click the button below to get started!",
              },
            },
            {
              'type': 'actions',
              'elements': [
                {
                  'type': 'button',
                  'action_id': 'setup_triage_workflow_button',
                  'text': {
                    'type': 'plain_text',
                    'text': 'Setup a new triage team',
                    'emoji': true,
                  },
                  'value': 'new_user',
                },
              ],
            },
          ],
  };
};

// TODO the initial option should be gotten from the previous state of the view

function staticSelectElement(actionId, placeHolderText, options, initialOption = {}) {
  return {
    'action_id': actionId,
    'type': 'static_select',
    'placeholder': {
      'type': 'plain_text',
      'text': placeHolderText,
      'emoji': true,
    },
    'options': options.map(option => SubBlocks.optionObj(option.name, option.value)),
    ...(Object.keys(initialOption).length !== 0 && {
      'initial_option': SubBlocks.optionObj(initialOption.name, initialOption.value),
    }),
  };
}
