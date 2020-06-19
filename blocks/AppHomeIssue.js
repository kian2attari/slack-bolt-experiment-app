module.exports = (issue_array) => { 
    let issues_block = [];

    // For every issue we push a block representing it!
    issue_array.forEach(issue => {

        console.log("issue in AppHomeIssue.js")
        console.log(issue)

        let issue_info = issue.node.content
        let issue_author_info = issue_info.author

        issues_block.push(  
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*${issue_info.title}* \n ${issue_info.body}`
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "View Issue",
                            "emoji": true
                        },
                        "url": issue_info.url,
                        "action_id": "link_button"
                    }
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Label this issue"
                },
                "accessory": {
                    "type": "static_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select an item",
                        "emoji": true
                    },
                    "options": [
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "*Bug*",
                                "emoji": true
                            },
                            "value": "value-0"
                        },
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "*Discussion*",
                                "emoji": true
                            },
                            "value": "value-1"
                        },
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "*this is plain_text text*",
                                "emoji": true
                            },
                            "value": "value-2"
                        }
                    ]
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Assign the issue to someone else"
                },
                "accessory": {
                    "type": "users_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select a user",
                        "emoji": true
                    }
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": "Opened by"
                    },
                    {
                        "type": "image",
                        "image_url": issue_author_info.avatarUrl,
                        "alt_text": `${issue_author_info.login}`
                    },
                    {
                        "type": "mrkdwn",
                        "text": `*${issue_author_info.login}*`
                    }
                ]
            },
            {
                "type": "divider"
            }
        )
        
    })

    return issues_block;

} 

