const {Messages} = require('../../blocks');

module.exports = (app, triage_team_data_obj) => {
  app.view('setup_triage_workflow_view', async ({ack, body, view, context}) => {
    // Acknowledge the view_submission event
    await ack();

    console.log(view.state.values);

    const selected_users_array =
      view.state.values.users_select_input.triage_users.selected_users;
    const user = body.user.id;

    console.log('selected_users_array', selected_users_array);

    const {selected_channel} = view.state.values.channel_select_input.triage_channel;

    // Message to send user
    const msg =
      selected_users_array.length !== 0
        ? 'Team members assigned successfully'
        : 'There was an error with your submission';

    // Assign the members to the team
    selected_users_array.forEach(user_id =>
      triage_team_data_obj.set_team_member(user_id)
    );

    // Set the team channel
    // TODO maybe we should update the DB at this point
    const team_channel_id = triage_team_data_obj.assign_team_channel(selected_channel);

    if (team_channel_id !== selected_channel) {
      console.log('Team channel assignment failed');
      return;
    }

    console.log('triage_team_data_obj', triage_team_data_obj);

    // Message the user
    try {
      await app.client.chat.postMessage({
        token: context.botToken,
        channel: user,
        text: msg,
      });

      const team_member_ids = triage_team_data_obj.team_data.team_members.keys();

      // Message the team members that were added to ask for their github usernames
      for (const slack_user_id of team_member_ids) {
        app.client.chat.postMessage({
          token: context.botToken,
          channel: slack_user_id,
          text:
            `Hey <@${slack_user_id}>! ` +
            "You've been added to the triage team. Tell me your GitHub username.",
          blocks: Messages.UsernameMapMessage(slack_user_id),
        });
      }
    } catch (error) {
      console.error(error);
    }
  });
};
