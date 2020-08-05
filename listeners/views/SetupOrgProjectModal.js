const {TriageTeamData} = require('../../models');
const {find_documents} = require('../../db');

module.exports = app => {
  app.view('setup_org_project_modal', async ({ack, body, view, context}) => {
    // Acknowledge the view_submission event
    await ack();

    const user = body.user.id;

    const db_user_filter = {};

    db_user_filter[`team_members.${user}`] = {$exists: true};

    const db_query = await find_documents(db_user_filter, {
      gitwave_github_app_installation_id: 1,
    });

    const installation_id = db_query[0].gitwave_github_app_installation_id;

    const selected_org_level_proj =
      view.state.values.org_project_input_block.org_level_project_input.selected_option;
    // set default project name
    TriageTeamData.set_org_level_project(
      {
        project_name: selected_org_level_proj.text.text,
        project_id: selected_org_level_proj.value,
      },
      installation_id
    );

    // // set untriaged label obj
    // triage_team_data_obj.set_untriaged_label(repo_path, {
    //   label_id: default_untriaged_issues_label.value,
    //   label_name: default_untriaged_issues_label.text.text,
    // });

    // Success! Message the user
    try {
      await app.client.chat.postMessage({
        token: context.botToken,
        // TODO message the whole team not just the user who the project board
        channel: user,
        text: `Hi <@${user}>, the organization project board was set successfully!`,
      });
    } catch (error) {
      console.error(error);
    }
  });
};
