const {dateFormatter} = require('./dateHelpers');

exports.setChannelTopicAndNotifyLatestAssignee = (
  app,
  teamChannelId,
  thisWeek,
  finalWeek = undefined
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
      channel: finalWeek ? finalWeek.assignedTeamMember : thisWeek.assignedTeamMember,
      // Just in case there is an issue loading the blocks.
      // EXTRA_TODO add blocks that also display a button that opens up the Edit Triage availability Modal
      // We only want to message the farthest assigned person (finalWeek) when its a regular weekly rotation. And we only want to message the person up for triage this week if the rotation was because the former assignee was unavailable
      text: finalWeek
        ? `Hey <@${
            finalWeek.assignedTeamMember
          }>, you are up for triage duty assignment on *${dateFormatter(
            new Date(finalWeek.date)
          )}*. \n If you are not available then, make sure to indicate that using the \`Triage Duty Availability\` Shortcut!`
        : `Hey <@${
            thisWeek.assignedTeamMember
          }>, the previous assignee is unavailable, so you were randomly assigned to triage duty for this week: *${dateFormatter(
            new Date(thisWeek.date)
          )}* `,
    }),
  ]);
