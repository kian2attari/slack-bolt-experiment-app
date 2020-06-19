module.exports = (on_triage_array, num_needs_triage, num_todo, num_in_progress, num_backlog, num_questions) => {
    return [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*More info about this repo...*"
            }
        },
        {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": `*On Triage Duty*\n ${on_triage_array}`
                },
                {
                    "type": "mrkdwn",
                    "text": `*Cards by category*\nNeeds Triage: ${num_needs_triage}\n Todo: ${num_todo}\n In Progress: ${num_in_progress} \n Backlog: ${num_backlog} \n Questions: ${num_questions}`
                }
            ]
        } 
    ] 
}