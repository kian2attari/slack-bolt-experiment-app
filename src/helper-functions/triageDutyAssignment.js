const {dateFormatter} = require('./dateHelpers');

exports.setChannelTopicAndNotifyLatestAssignee = (
  app,
  teamChannelId,
  thisWeek,
  finalWeek
) =>
  Promise.all([
    app.client.conversations.setTopic({
      token: process.env.SLACK_BOT_TOKEN,
      channel: teamChannelId,
      topic: `<@${
        thisWeek.assignedTeamMember
      }> is on triage duty for the week of ${dateFormatter(new Date(thisWeek.date))}!`,
    }),
    app.client.chat.postMessage({
      // Since there is no context we just use the original token
      token: process.env.SLACK_BOT_TOKEN,
      channel: finalWeek.assignedTeamMember,
      // Just in case there is an issue loading the blocks.
      // EXTRA_TODO add blocks that also display a button that opens up the Edit Triage availability Modal
      text: `Hey <@${
        finalWeek.assignedTeamMember
      }>, you are up for triage duty assignment on *${dateFormatter(
        new Date(finalWeek.date)
      )}*. \n If you are not available then, make sure to indicate that using the \`Triage Duty Availability\` Shortcut!`,
    }),
  ]);
