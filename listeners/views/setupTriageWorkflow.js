const {Messages, Modals} = require('../../blocks');
const {TriageTeamData} = require('../../models');

module.exports = app => {
  app.view('setup_triage_workflow_view', async ({ack, body, view, context}) => {
    // Acknowledge the view_submission event
    await ack();

    const {values} = view.state;

    const user = body.user.id;

    const selected_users_array = values.users_select_input.triage_users.selected_users;

    const selected_discussion_channel =
      values.discussion_channel_select_input.discussion_channel.selected_channel;

    const selected_internal_triage_channel =
      values.triage_channel_select_input.triage_channel.selected_channel;

    const selected_github_org =
      values.github_org_input_block.github_org_select_input.selected_option;

    const create_new_team_result = await TriageTeamData.associate_team_with_installation(
      selected_users_array,
      selected_discussion_channel,
      selected_internal_triage_channel,
      selected_github_org
    );

    if (create_new_team_result.result.n !== 1) {
      // TODO if the error is that the team already exists, explain this to the user
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

    try {
      // Message the creator of the team
      await app.client.chat.postMessage({
        token: context.botToken,
        channel: user,
        text: 'Team added successfully.',
      });

      // Open the org-level project selection modal
      await app.client.views.open({
        token: context.botToken,
        // Pass a valid trigger_id within 3 seconds of receiving it
        trigger_id: body.trigger_id,
        // Show the org-level project board selection modal. The parameter is the organization's node ID
        view: Modals.setup_org_project_modal(selected_github_org.value),
      });
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
