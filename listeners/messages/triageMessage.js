const {reg_exp} = require('../../constants');

module.exports = app => {
  app.message(reg_exp.triage_circles_regexp, async ({context, message, say}) => {
    console.log('regexp matches', context.matches);

    // RegExp matches are inside of context.matches
    const triage_priority = context.matches[0];

    let nature_of_message;

    console.log('regex match', triage_priority.match(reg_exp.individual_circles_regexp));

    switch (triage_priority.match(reg_exp.individual_circles_regexp)[0]) {
      case 'red':
        nature_of_message = 'urgent issue';
        break;
      case 'blue':
        nature_of_message = 'issue';
        break;
      case 'white':
        nature_of_message = 'feedback';
        break;
      default:
        nature_of_message = 'issue';
    }

    await say(
      `Hey there <@${message.user}>, thanks for your submitting your ${nature_of_message}! I've notified the team and they should respond shortly.`
    );
  });
};
