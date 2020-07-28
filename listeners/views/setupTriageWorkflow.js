const {Messages} = require('../../blocks');
const {TriageTeamData} = require('../../models');

module.exports = (app, triage_team_data_obj) => {
  app.view('setup_triage_workflow_view', async ({ack, body, view, context}) => {
    // Acknowledge the view_submission event
    await ack();

    console.log(view.state.values);

    const selected_users_array =
      view.state.values.users_select_input.triage_users.selected_users;
    const user = body.user.id;

    console.log('selected_users_array', selected_users_array);

    const selected_discussion_channel =
      view.state.values.discussion_channel_select_input.discussion_channel
        .selected_channel;

    // TODO ALSO GET seperate internal triage channel id. Updatge modal to include this
    const selected_internal_triage_channel =
      view.state.values.triage_channel_select_input.triage_channel.selected_channel;

    const create_new_team_result = await TriageTeamData.create_new_team(
      selected_users_array,
      selected_discussion_channel,
      selected_internal_triage_channel
    );

    if (create_new_team_result.result.n !== 1) {
      // TODO if the error is tha the team aleady exists, explain this to the user
      const error_msg =
        "There was an error creating the team and adding it to the DB. Make sure it doesn't already exist";

      console.error(error_msg);

      await app.client.chat.postMessage({
        token: context.botToken,
        channel: user,
        text: error_msg,
      });
      return;
    }

    await app.client.chat.postMessage({
      token: context.botToken,
      channel: user,
      text: 'Team added successfully.',
    });

    try {
      // Message the team members that were added to ask for their github usernames
      for (const slack_user_id of selected_users_array) {
        app.client.chat.postMessage({
          token: context.botToken,
          channel: slack_user_id,
          text:
            `Hey <@${slack_user_id}>! ` +
            "You've been added to the triage team. Tell me your GitHub username.",
          blocks: Messages.UsernameMapMessage(slack_user_id),
        });
      }
    } catch (err) {
      console.error(err);
    }

    console.log('create_new_team_result', create_new_team_result);
  });
};
