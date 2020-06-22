module.exports = (issue_blocks=undefined, more_info_blocks=undefined, selected_option=undefined) => { 
	return {
		"type": "home",
		"blocks": [
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": "Find issues that need triaging"
				},
				"accessory": {
					// If an option has been selected, render this select box with that option already selected
					...(typeof selected_option !== 'undefined' ? {"initial_option": selected_option} : {}),
					"action_id": "project_list",
					"type": "external_select",
					"placeholder": {
						"type": "plain_text",
						"text": "Select a GitHub project"
					},
					"min_query_length": 0
				}
			},
			{
				"type": "divider"
			},
			// If issue blocks have been provided, render them here
			...(typeof issue_blocks !== 'undefined' ? issue_blocks : []),
		
			// If the more info block has been provided, render it here
			...(typeof more_info_blocks !== 'undefined' ? more_info_blocks : [])
		]
	}
}
