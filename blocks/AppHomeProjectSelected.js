const AppHomeIssue  = require('./AppHomeIssue')

module.exports = (selected_option, issue_array, project_number) => { 

    return {
        "type": "home",
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Find some new issues to triage*"
                },
   
                "accessory": {
                    "initial_option": selected_option,
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
            },
            // Returns a block with a section for each issue
            ...AppHomeIssue(issue_array),

            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*View some more info about this project...*"
                },
                "accessory": {
                    "action_id": "column_card_count_info",
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "See number of cards by column",
                        "emoji": true
                    },
                    "value": project_number
                }
            },
            {
                "type": "divider"
            }
        ]
    } 
}
