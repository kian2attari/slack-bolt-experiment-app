const {TriageTeamData} = require('../../models');

module.exports = app => {
  app.view('map_username_modal', async ({ack, body, view, context}) => {
    // Acknowledge the view_submission event
    await ack();

    const github_username =
      view.state.values.map_username_block.github_username_input.value;

    console.log('github username', github_username);

    const slack_user_id = body.user.id;

    const reply_message = {
      token: context.botToken,
      channel: slack_user_id,
      text:
        `<@${slack_user_id}>, ` +
        'your Slack and Github usernames were associated successfully! Your GitHub username is currently set to' +
        ` ${github_username}. ` +
        "If that doesn't look right, click the enter github username button again.",
    };

    try {
      await TriageTeamData.set_user_github_username(slack_user_id, github_username);
    } catch (error) {
      console.error(error);
      reply_message.text = `Hey <@${slack_user_id}>,  ${github_username} is not a valid GitHub username. Please double check your spelling. `;
    }

    // Message the user
    try {
      await app.client.chat.postMessage(reply_message);
    } catch (error) {
      console.error(error);
    }
  });
};
