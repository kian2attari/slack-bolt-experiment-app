const {Messages} = require('../../blocks');

module.exports = app => {
  app.shortcut('modify_github_username', async ({shortcut, ack, context, client}) => {
    try {
      // Acknowledge shortcut request
      await ack();

      const slackUserId = shortcut.user.id;
      // Call the views.open method using one of the built-in WebClients
      client.chat.postMessage({
        token: context.botToken,
        channel: slackUserId,
        text: `Hey <@${slackUserId}>! Click here to change your GitHub username`,
        blocks: Messages.UsernameMapMessage(slackUserId),
      });
    } catch (error) {
      console.error(error);
    }
  });
};
