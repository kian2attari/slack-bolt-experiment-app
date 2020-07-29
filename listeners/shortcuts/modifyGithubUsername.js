const {Messages} = require('../../blocks');

module.exports = app => {
  app.shortcut('modify_github_username', async ({shortcut, ack, context, client}) => {
    try {
      // Acknowledge shortcut request
      await ack();

      const user_id = shortcut.user.id;
      // TODO open the modal directly rather than send the usernamemap message
      // Call the views.open method using one of the built-in WebClients
      client.chat.postMessage({
        token: context.botToken,
        channel: user_id,
        text: `Hey <@${user_id}>! Click here to change your GitHub username`,
        blocks: Messages.UsernameMapMessage(user_id),
      });
    } catch (error) {
      console.error(error);
    }
  });
};
