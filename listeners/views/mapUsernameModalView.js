const {setUserGithubUsername} = require('../../models');

module.exports = app => {
  app.view('map_username_modal', async ({ack, body, view, context}) => {
    // Acknowledge the view_submission event
    await ack();

    const githubUsername =
      view.state.values.map_username_block.github_username_input.value;

    console.log('github username', githubUsername);

    const slackUserId = body.user.id;

    const replyMessage = {
      token: context.botToken,
      channel: slackUserId,
      text:
        `<@${slackUserId}>, ` +
        'your Slack and Github usernames were associated successfully! Your GitHub username is currently set to' +
        ` ${githubUsername}. ` +
        "If that doesn't look right, click the enter github username button again.",
    };

    try {
      await setUserGithubUsername(slackUserId, githubUsername);
    } catch (error) {
      console.error(error);
      replyMessage.text = `Hey <@${slackUserId}>,  ${githubUsername} is not a valid GitHub username. Please double check your spelling. `;
    }

    // Message the user
    try {
      await app.client.chat.postMessage(replyMessage);
    } catch (error) {
      console.error(error);
    }
  });
};
