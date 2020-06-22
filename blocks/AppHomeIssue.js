module.exports = (issue_array) => 
    {
    let issues_block = [];

    // For every issue we push a block representing it!
    issue_array.forEach(issue => {

        console.log("issue in AppHomeIssue.js")
        console.log(issue)

        const issue_info = issue.node.content

        const issue_id = issue_info.id
    
        const issue_author_info = issue_info.author

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
            /* The GitHub GraphQL API needs both the issue ID and 
            the label id to assign a label. The block_id is set as 
            the id of the issue so that the unique issue id is sent over 
            with the label id when a label is selected. */
            {
                "type": "section",
                "block_id": issue_id,
                "text": {
                    "type": "mrkdwn",
                    "text": "Label this issue"
                },
                "accessory": {
                    "action_id": "label_list",
                    "type": "external_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select a label"
                    },
                    "min_query_length": 0
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Assign the issue"
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

