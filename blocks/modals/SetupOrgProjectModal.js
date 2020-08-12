exports.setupOrgProjectModal = selectedOrgNodeId => ({
  'type': 'modal',
  'callback_id': 'setupOrgProjectModal',
  'private_metadata': JSON.stringify({selectedOrgNodeId}), // Needed when the view is submitted in order to show a list of the org's projects
  'title': {
    'type': 'plain_text',
    'text': 'Select an Org project',
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
          "GitWave will synchronize the individual project boards of the team's repos with an Organization-level project board. This allows them to have an umbrella view of the issues across their assigned repos.",
      },
    },
    {
      'type': 'input',
      'block_id': 'org_project_input_block',
      'label': {
        'type': 'plain_text',
        'text': 'Assign the GitHub org for this team',
        'emoji': true,
      },
      'element': {
        'type': 'external_select',
        'min_query_length': 0,
        'placeholder': {
          'type': 'plain_text',
          'text': 'Select a project board',
          'emoji': true,
        },
        'action_id': 'org_level_project_input',
      },
    },
  ],
});
