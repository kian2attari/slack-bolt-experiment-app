const {regExp} = require('../../constants');
const {addNewInternalIssue, findValidTriageChannel} = require('../../db');

// Middleware to make sure that the message was posted in a triage channel
async function validTriageChannelListener({message, next}) {
  const validTriageChannel = await findValidTriageChannel(message.channel);

  if (validTriageChannel.length !== 0) {
    await next();
  }
}

module.exports = app => {
  app.message(
    regExp.triageCirclesRegexp,
    validTriageChannelListener,
    async ({context, message, client}) => {
      // RegExp matches are inside of context.matches
      const triagePriority = context.matches[0];

      const natureOfMessage = {text: '', urgency: ''};

      switch (triagePriority.match(regExp.individualCirclesRegexp)[0]) {
        case 'red':
          natureOfMessage.text = 'urgent issue';
          natureOfMessage.urgency = 'high';
          break;
        case 'blue':
          natureOfMessage.text = 'issue';
          natureOfMessage.urgency = 'medium';
          break;
        case 'white':
          natureOfMessage.text = 'feedback';
          natureOfMessage.urgency = 'low';
          break;
        // no default
      }

      // Takes some key data from the message
      const keyMessageData = (({text, user, ts: issueMessageTs}) => ({
        text,
        user,
        issueMessageTs,
        urgency: natureOfMessage.urgency,
      }))(message);

      const {permalink} = await app.client.chat.getPermalink({
        token: context.botToken,
        channel: message.channel,
        'message_ts': keyMessageData.issueMessageTs,
      });

      console.log('permalink', permalink);

      keyMessageData.deepLinkToMessage = `slack://channel?team=${message.team}&id=${message.channel}&message=${message.ts}`;

      const newIssueObj = {
        teamInternalTriageChannelId: message.channel,
        internalTriageItem: keyMessageData,
      };

      console.log('new issue obj triage Message', newIssueObj);

      const response = await addNewInternalIssue(newIssueObj);

      const wasAdded = response.result.n === 1;
      console.log('Was the issue added successfully? :', wasAdded);

      const replyMessage = wasAdded
        ? `Hey there <@${message.user}>, thanks for your submitting your ${natureOfMessage.text}! I've notified the team and they should respond shortly.`
        : `Hey <@${message.user}>, I encountered an error while sending your ${natureOfMessage.text} to our triage team's dashboard. Please '@' them directly for help with this.`;
      await client.chat.postMessage({
        text: replyMessage,
        token: context.botToken,
        channel: message.channel,
        'thread_ts': message.ts,
      });
    }
  );
};
