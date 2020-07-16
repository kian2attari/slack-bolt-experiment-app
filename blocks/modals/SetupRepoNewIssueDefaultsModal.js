const SubBlocks = require('../SubBlocks');

module.exports = (
  selected_repo = {repo_path: undefined, selected_project_name: undefined}
) => {
  return {
    'type': 'modal',
    'private_metadata': JSON.stringify(selected_repo),
    'callback_id': 'repo_new_issue_defaults_modal',
    'title': {
      'type': 'plain_text',
      'text': 'Setup New Issue flow',
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
            'Here you can pick the label you want applied to all new/untriaged issues on your repo as they are created, and the GitHub project and subsequent column the issue card should be placed in!',
        },
      },
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': '*Repository you want to set these defaults for*',
        },
        'accessory': {
          'type': 'external_select',
          'min_query_length': 0,
          'placeholder': {
            'type': 'plain_text',
            'text': 'Select repo',
            'emoji': true,
          },
          'action_id': 'setup_default_modal_repo_selection',
          ...(typeof selected_repo.repo_path !== 'undefined'
            ? {'initial_option': SubBlocks.option_obj(selected_repo.repo_path)}
            : {}),
        },
      },
      ...(typeof selected_repo.repo_path !== 'undefined'
        ? set_label_project_column_blocks(selected_repo)
        : []),
    ],
  };
};
/**
 * Returns the blocks for picking the default label, project and column for new issues.
 * Should only be included in the view if the user has already picked a repository.
 *
 //* @param {{repo_path: string, selected_project_name: string}} repo_obj
 * @returns An array of block kit elements
 */
function set_label_project_column_blocks() {
  return [
    {
      'type': 'divider',
    },
    {
      'type': 'input',
      'block_id': 'untriaged_label_block_input',
      'label': {
        'type': 'plain_text',
        'text': 'Label to assign to all New/Untriaged issues',
        'emoji': true,
      },
      'element': {
        'type': 'external_select',
        'min_query_length': 0,
        'placeholder': {
          'type': 'plain_text',
          'text': 'Select label',
          'emoji': true,
        },
        'action_id': 'setup_default_modal_label_list',
      },
    },
    {
      'type': 'input',
      // REVIEW if assigning new issues to a project is not possible, take this out and simplify this whole file. The only needed block in that case is the label dropdown.
      'block_id': 'untriaged_project_block_input',
      'label': {
        'type': 'plain_text',
        'text': 'Project that new issues should be assigned to',
        'emoji': true,
      },
      'element': {
        'type': 'external_select',
        'min_query_length': 0,
        'placeholder': {
          'type': 'plain_text',
          'text': 'Select project',
          'emoji': true,
        },
        'action_id': 'setup_default_modal_project_selection',
      },
    },
    // OLD This feature is currently commented out since the tools team is debating the value of the need's triage column in its entirety.
    // If the project has been selected, show the column list
    // ...(Object.prototype.hasOwnProperty.call(repo_obj, 'selected_project_name') &&
    // typeof repo_obj.selected_project_name !== 'undefined'
    //   ? [
    //       {
    //         'type': 'input',
    //         'label': {
    //           'type': 'plain_text',
    //           'text': 'Default project column for New/Untriaged issues',
    //           'emoji': true,
    //         },
    //         'element': {
    //           'type': 'external_select',
    //           'min_query_length': 0,
    //           'placeholder': {
    //             'type': 'plain_text',
    //             'text': 'Select column',
    //             'emoji': true,
    //           },
    //           'action_id': 'setup_default_modal_column_selection',
    //         },
    //       },
    //     ]
    //   : []),
  ];
}
