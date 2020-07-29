const {reg_exp} = require('../../constants');
const {add_new_internal_issue} = require('../../db');

module.exports = app => {
  app.message(reg_exp.triage_circles_regexp, async ({context, message, say}) => {
    console.log('message', message);

    // RegExp matches are inside of context.matches
    const triage_priority = context.matches[0];

    const nature_of_message = {text: '', urgency: ''};

    console.log('regex match', triage_priority.match(reg_exp.individual_circles_regexp));

    switch (triage_priority.match(reg_exp.individual_circles_regexp)[0]) {
      case 'red':
        nature_of_message.text = 'urgent issue';
        nature_of_message.urgency = 'high';
        break;
      case 'blue':
        nature_of_message.text = 'issue';
        nature_of_message.urgency = 'medium';
        break;
      case 'white':
        nature_of_message.text = 'feedback';
        nature_of_message.urgency = 'low';
        break;
      // no default
    }

    // Takes some key data from the message
    const key_message_data = (({text, user, ts: issue_message_ts}) => ({
      text,
      user,
      issue_message_ts,
      urgency: nature_of_message.urgency,
    }))(message);

    const new_issue_obj = {
      team_internal_triage_channel_id: message.channel,
      internal_triage_item: key_message_data,
    };

    console.log('new issue obj triage Message', new_issue_obj);

    const response = await add_new_internal_issue(new_issue_obj);

    const was_added = response.result.n === 1;
    console.log('Was the issue added successfully? :', was_added);

    const reply_message = was_added
      ? `Hey there <@${message.user}>, thanks for your submitting your ${nature_of_message.text}! I've notified the team and they should respond shortly.`
      : `Hey <@${message.user}>, I encountered an error while sending your ${nature_of_message.text} to our triage team's dashboard. Please '@' them directly for help with this.`;
    await say(reply_message);
  });
};
