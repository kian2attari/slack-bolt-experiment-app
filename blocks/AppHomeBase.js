module.exports = (issue_blocks=undefined, more_info_blocks=undefined) => { 
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
			...(typeof issue_blocks != 'undefined' ? issue_blocks : []),
			...(typeof more_info_blocks != 'undefined' ? more_info_blocks : [])
		]
	}
}
