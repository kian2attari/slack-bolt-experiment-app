module.exports = (subscribed_repos_list=[]) => {

    let current_subscriptions_options = subscribed_repos_list.map((repo) => {
        return {
            "text": {
                "type": "plain_text",
                "text": repo,
                "emoji": true
            },
            "value": repo
        }
    })


    console.log("current_subscriptions_options", current_subscriptions_options)

    
    return {
        "callback_id": "modify_repo_subscriptions",
        "type": "modal",
        "title": {
            "type": "plain_text",
            "text": "Edit repo subscriptions",
            "emoji": true
        },
        "submit": {
            "type": "plain_text",
            "text": "Submit",
            "emoji": true
        },
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
                    "text": "Subscribe to a repo in order to manage it on Slack with GitWave and receive important notifications. \n\n Here you can *subscribe* to or *unsubscribe* from a GitHub repo."
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "input",
                "optional": true,
                "block_id": "subscribe_to_repo_block",
                "element": {
                    "action_id": "subscribe_to_repo_input",
                    "type": "plain_text_input",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "ex: slackapi/bolt-js",
                        "emoji": true
                    }
                },
                "label": {
                    "type": "plain_text",
                    "text": ":heavy_plus_sign:  Subscribe to a new repo (repo_owner/repo_name)",
                    "emoji": true
                }
            },
            // {
            //     "type": "actions",
            //     "elements": [
            //         {
            //             "type": "button",
            //             "style": "primary",
            //             "text": {
            //                 "type": "plain_text",
            //                 "text": "Subscribe to repo",
            //                 "emoji": true
            //             },
            //             "value": "subscribe_repo_button"
            //         }
            //     ]
            // },
            // If they aren't currently subscribed to any repos, don't show this section!
            ...(current_subscriptions_options && current_subscriptions_options.length ? unsubscribe_block(current_subscriptions_options) : [])
        ]
    }

}

function unsubscribe_block(current_subscriptions_options) {
    return [{
        "type": "input",
        "block_id": "unsubscribe_repos_block",
        "element": {
            "action_id": "unsubscribe_repos_input",
            "type": "static_select",
            "placeholder": {
                "type": "plain_text",
                "text": "Select an existing repo subscription",
                "emoji": true
            },
            "options": current_subscriptions_options
        },
        "label": {
            "type": "plain_text",
            "text": ":remove:  Unsubscribe from a repo",
            "emoji": true
        }
    }]
}
    // {
    //     "type": "actions",
    //     "elements": [
    //         {
    //             "type": "button",
    //             "style": "danger",
    //             "text": {
    //                 "type": "plain_text",
    //                 "text": "Unsubscribe from repo",
    //                 "emoji": true
    //             },
    //             "value": "unsubscribe_repo_button"
    //         }
    //     ]
    // }
