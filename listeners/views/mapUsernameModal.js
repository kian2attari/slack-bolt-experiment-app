module.exports = (app, triage_team_data_obj) => {
  app.view('map_username_modal', async ({ack, body, view, context}) => {
    // Acknowledge the view_submission event
    await ack();

    console.log(view.state.values);

    const github_username =
      view.state.values.map_username_block.github_username_input.value;

    console.log('github username', github_username);

    // RegExp for checking the username
    const github_username_checker = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

    const valid_github_username = github_username_checker.test(github_username);

    console.log(': --------------------------------------------');
    console.log('valid_github_username', valid_github_username);
    console.log(': --------------------------------------------');

    const slack_user_id = body.user.id;

    console.log('slack_user_id ', slack_user_id);

    if (!valid_github_username) {
      // TODO maybe open a modal
      console.log(`${github_username} is not a valid github username`);
      try {
        await app.client.chat.postMessage({
          token: context.botToken,
          channel: slack_user_id,
          text: `Hey <@${slack_user_id}>,  ${github_username} is not a valid GitHub username. Please double check your spelling. `,
        });
      } catch (error) {
        console.error(error);
      }
      return;
    }

    const slack_id_to_gh_username_match = triage_team_data_obj.get_team_member_by_github_username(
      github_username
    );
    console.log(': ------------------------------------------------------------');
    console.log('1 slack_id_to_gh_username_match', slack_id_to_gh_username_match);
    console.log(': ------------------------------------------------------------');
    /* REVIEW potentially message the user or open a confirmation modal of some sort if the user already has a github username 
        setup. This would actually be better done on the actual modal before submission. The modal should show the person's current
        github name, and it should be a confirm type modal 
        TODO all the above stuff */
    // if (Object.keys(github_username_to_slack_id_match).length !== 0) {
    //   // Message the user
    //   try {
    //     await app.client.chat.postMessage({
    //       token: context.botToken,
    //       channel: slack_user_id,
    //       text:
    //         `<@${slack_user_id}>, ` +
    //         'your Slack and Github usernames were associated successfully! Your GitHub username is currently set to' +
    //         ` ${github_username}. ` +
    //         "If that doesn't look right, click the enter github username button again.",
    //     });
    //   } catch (error) {
    //     console.error(error);
    //   }
    //   return;
    // }
    // TODO just check if its not equal to zero and say that a la above
    if (Object.keys(slack_id_to_gh_username_match).length === 0) {
      // We map the github username to that Slack username
      triage_team_data_obj.set_team_member(slack_user_id, github_username);

      console.log(': ------------------------------------------------------------');
      console.log('2 slack_id_to_gh_username_match', slack_id_to_gh_username_match);
      console.log(': ------------------------------------------------------------');

      console.log(': ------------------------------------------');
      console.log(
        'Success map added check',
        triage_team_data_obj.get_team_member_by_github_username(github_username)
      );
      console.log(': ------------------------------------------');

      // Message the user
      try {
        await app.client.chat.postMessage({
          token: context.botToken,
          channel: slack_user_id,
          text:
            `<@${slack_user_id}>, ` +
            'your Slack and Github usernames were associated successfully! Your GitHub username is currently set to' +
            ` ${github_username}. ` +
            "If that doesn't look right, click the enter github username button again.",
        });
      } catch (error) {
        console.error(error);
      }
    }
  });
};
