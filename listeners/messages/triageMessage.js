const {reg_exp} = require('../../constants');
const {update_one_in_DB} = require('../../db');

module.exports = app => {
  app.message(reg_exp.triage_circles_regexp, async ({context, message, say}) => {
    console.log('message', message);

    // RegExp matches are inside of context.matches
    const triage_priority = context.matches[0];

    const nature_of_message = {text: 'issue', urgency: ''};

    console.log('regex match', triage_priority.match(reg_exp.individual_circles_regexp));

    switch (triage_priority.match(reg_exp.individual_circles_regexp)[0]) {
      case 'red':
        nature_of_message.text = 'urgent issue';
        nature_of_message.urgency = 'high';
        break;
      case 'white':
        nature_of_message.text = 'feedback';
        nature_of_message.urgency = 'low';
        break;
      default:
        nature_of_message.text = 'issue';
        nature_of_message.urgency = 'medium';
    }

    // Takes some key data from the message
    const key_message_data = (({text, user, ts, event_ts}) => ({
      text,
      user,
      ts,
      event_ts,
      urgency: nature_of_message.urgency,
    }))(message);

    const update_obj = {
      internal_triage_channel_id: message.channel,
      internal_triage_item: key_message_data,
    };

    update_one_in_DB(update_obj);

    await say(
      `Hey there <@${message.user}>, thanks for your submitting your ${nature_of_message.text}! I've notified the team and they should respond shortly.`
    );
  });
};

// TODO Listen for when the :eyes: and :checkmark: emoji are added and update the database
