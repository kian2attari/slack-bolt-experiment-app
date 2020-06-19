module.exports = (array_column_info) => {
    
    let column_info = ""

    // Creating a line of info for every column
    array_column_info.forEach(column => {
        column_info += `*${column.name}:* ${column.cards.totalCount} ` + (column.cards.totalCount == 1 ? "card\n" : "cards\n" )
    })

    return {
        "type": "modal",
        "close": {
            "type": "plain_text",
            "text": "Close",
            "emoji": true
        },
        "title": {
            "type": "plain_text",
            "text": "More Information",
            "emoji": true
        },
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": ":tada: Here's a summary of your project"
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Number of cards in each column\n" + column_info
                }
                
            } 
        ]
    }
    
}