module.exports = 
{
	"type": "home",
	"blocks": [
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "*Find some new issues to triage*"
			},
			"accessory": {
				"action_id": "project_list",
				"type": "external_select",
				"placeholder": {
					"type": "plain_text",
					"text": "Select a GitHub project to triage"
				},
				"min_query_length": 1
			}
		},
		{
			"type": "divider"
		}
	]
}