module.exports = (user_group_list=["cool group", "hackers", "salad team 38", "yeeter skitter"]) => {


    let user_group_option_element = (name) => {
        return {
            "text": {
                "type": "plain_text",
                "text": name,
                "emoji": true
            },
            // No spaces in value
            "value": name.replace(/\s/g , "-")
        }
    }

    const user_group_option_block = user_group_list.map((user_group) => user_group_option_element(user_group))

    console.log(user_group_option_block)

return {
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
				"text": "GitWave requires a *user group* of the team members responsible for triaging to be set up. Please select it below if it exists, or create a new one!"
			}
		},
		{
			"type": "divider"
		},
		{
			"type": "input",
			"label": {
				"type": "plain_text",
				"text": "Already have a user group for your triagers?",
				"emoji": true
			},
			"element": {
				"type": "static_select",
				"placeholder": {
					"type": "plain_text",
					"text": "Select an existing user group",
					"emoji": true
				},
				"options": user_group_option_block
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "*No existing user group? No problem*"
			},
			"accessory": {
				"type": "button",
				"text": {
					"type": "plain_text",
					"text": "Create triage team user group",
					"emoji": true
				},
				"value": "click_me_123"
			}
		}
	]
    }
}
