module.exports = (project_number) => { 

    return [
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
