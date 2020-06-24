module.exports = {
	"callback_id": "setup_triage_workflow_view",
	"title": {
		"type": "plain_text",
		"text": "Setup GitWave",
		"emoji": true
	},
	"submit": {
		"type": "plain_text",
		"text": "Submit",
		"emoji": true
	},
	"type": "modal",
	"close": {
		"type": "plain_text",
		"text": "Cancel",
		"emoji": true
	},
	"blocks": [
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "GitWave needs to know the team members responsible for triaging. This is so relevant notifications can be forwarded to them."
			}
		},
		{
			"type": "divider"
		},
		{
			"type": "input",
			"block_id": "users_select_input",
			"element": {
				"type": "multi_users_select",
				"action_id": "triage_users",
				"placeholder": {
					"type": "plain_text",
					"text": "Select users",
					"emoji": true
				}
			},
			"label": {
				"type": "plain_text",
				"text": "Select the users directly responsible for triaging",
				"emoji": true
			}
		}
	]
}

