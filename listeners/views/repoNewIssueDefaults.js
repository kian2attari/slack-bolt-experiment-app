module.exports = (app, triage_team_data_obj) => {
  app.view('repo_new_issue_defaults_modal', async ({ack, body, view, context}) => {
    // Acknowledge the view_submission event
    await ack();

    const slack_user_id = body.user.id;

    const view_values = view.state.values;

    const {repo_path} = JSON.parse(view.private_metadata);

    const default_untriaged_issues_label =
      view_values.untriaged_label_block_input.setup_default_triage_label_list
        .selected_option;

    const default_untriaged_issues_project =
      view_values.untriaged_project_block_input.setup_default_project_selection
        .selected_option;

    // set default project name
    triage_team_data_obj.set_default_untriaged_project(repo_path, {
      project_name: default_untriaged_issues_project.text.text,
      project_id: default_untriaged_issues_project.value,
    });
    // Link repo to said project
    // await graphql.call_gh_graphql(mutation.linkRepoToOrgLevelProject, {
    //   project_id: default_untriaged_issues_project.value,
    //   repo_id: triage_team_data_obj.get_team_repo_subscriptions(repo_path).repo_id,
    // });

    // set default label obj
    triage_team_data_obj.set_untriaged_label(repo_path, {
      label_id: default_untriaged_issues_label.value,
      label_name: default_untriaged_issues_label.text.text,
    });

    console.log(': --------------------------------------------------------------');
    console.log('default_untriaged_issues_label', default_untriaged_issues_label);
    console.log(': --------------------------------------------------------------');

    console.log(': ------------------------------------------------------------------');
    console.log('default_untriaged_issues_project', default_untriaged_issues_project);
    console.log(': ------------------------------------------------------------------');

    console.log(': ------------------------------------------------------------------');
    console.log(
      'untriaged settings repo with defaults applied',
      triage_team_data_obj.team_data.subscribed_repo_map.get(repo_path).untriaged_settings
    );
    console.log(': ------------------------------------------------------------------');

    // Success! Message the user
    try {
      await app.client.chat.postMessage({
        token: context.botToken,
        channel: slack_user_id,
        text: `Hi <@${slack_user_id}>, the default label and project for new/untriaged issues was assigned successfully!`,
      });
    } catch (error) {
      console.error(error);
    }
  });
};
