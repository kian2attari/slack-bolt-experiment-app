const {SafeAccess} = require('../../helper-functions');
const {Messages} = require('../../blocks');
const {TriageTeamData} = require('../../models');

module.exports = (app, triage_team_data, app_home_state) => {
  app.view('modify_repo_subscriptions', async ({ack, body, view, context}) => {
    // Acknowledge the view_submission event
    await ack();

    const slack_user_id = body.user.id;

    const view_values = view.state.values;

    const subscribe_repo =
      view_values.subscribe_to_repo_block.subscribe_to_repo_input.value;

    const unsubscribe_block = view_values.unsubscribe_repos_block;

    const triage_team_data_obj = triage_team_data;

    const user_app_home_state_obj = app_home_state;

    if (triage_team_data_obj.team_discussion_channel_id.length === 0) {
      console.log(
        'You must create a triage team and assign them a channel before you can begin subscribing to repos!'
      );

      try {
        app.client.chat.postMessage({
          token: context.botToken,
          channel: slack_user_id,
          // TODO Check if mentions are setup and change the message based on that
          text: `<@${slack_user_id}> you must create a triage team and assign them a channel before you can begin subscribing to repos!.`,
        });
      } catch (error) {
        console.error(error);
      }
      return;
    }

    const current_subscribed_repos = triage_team_data_obj.get_team_repo_subscriptions();

    const unsubscribe_repo = SafeAccess(
      () => unsubscribe_block.unsubscribe_repos_input.selected_option.value
    );

    if (typeof subscribe_repo === 'undefined' && unsubscribe_repo === null) {
      console.log('No repos specified by user');
      return;
    }

    let subscribe_repo_obj = {};
    try {
      subscribe_repo_obj =
        typeof subscribe_repo !== 'undefined'
          ? await TriageTeamData.new_repo_obj(subscribe_repo)
          : null;
    } catch (error) {
      console.error(error);
      app.client.chat.postMessage({
        token: context.botToken,
        channel: slack_user_id,
        // TODO Check if mentions are setup and change the message based on that
        text: `I can't find *${subscribe_repo}*. Have you installed the GitWave GitHub App on this repo/organization? Also please double check your spelling! <@${slack_user_id}>.`,
      });
      return;
    }

    console.log('triage_team_data_obj before', triage_team_data_obj);

    // Logs the input for subscribing to new repo if any
    console.log('1 subscribe_repo_obj', subscribe_repo_obj);

    // Logs the unsubscribe repos if any are present
    console.log('unsubscribe_repo: ', unsubscribe_repo);

    // ERROR! The user is already subscribed to the repo they want to subscribe to
    if (
      subscribe_repo_obj !== null &&
      current_subscribed_repos.has(subscribe_repo_obj.repo_path)
    ) {
      app.client.chat.postMessage({
        token: context.botToken,
        channel: slack_user_id,
        text: `Whoops <@${slack_user_id}>, you're already subscribed to *${subscribe_repo_obj.repo_path}*`,
      });
      console.error(`User already subscribed to repo ${subscribe_repo_obj.repo_path}`);
    } else if (unsubscribe_repo !== null) {
      // TODO seperate subscribe and unsubscribe. This is a headache
      // ERROR! The user is trying to subscribe and unsubscribe from the same repo
      if (
        subscribe_repo_obj !== null &&
        typeof current_subscribed_repos.get(subscribe_repo_obj.repo_path) !== 'undefined'
      ) {
        app.client.chat.postMessage({
          token: context.botToken,
          channel: slack_user_id,
          // TODO Check if mentions are setup and change the message based on that
          text:
            `<@${slack_user_id}> Woah there Schrödinger, ` +
            "you can't simultaneously subscribe and unsubscribe from" +
            ` *${unsubscribe_repo}*`,
        });
        console.log(
          // eslint-disable-next-line prefer-template
          'User tried to simultaneously subscribe and unsubscribe to repo ' +
            subscribe_repo_obj.repo_path
        );
        return;
      }
      current_subscribed_repos.delete(unsubscribe_repo);
      if (unsubscribe_repo === user_app_home_state_obj.currently_selected_repo) {
        user_app_home_state_obj.currently_selected_repo = {};
      }

      // Everything is in order, unsubscribe from the specified repo
      app.client.chat.postMessage({
        token: context.botToken,
        channel: slack_user_id,
        // TODO Check if mentions are setup and change the message based on that
        text: `Hey <@${slack_user_id}>!, you are now unsubscribed from *${unsubscribe_repo}*`,
      });
      console.error(`User unsubscribed from repo: ${unsubscribe_repo}`);
    }
    console.log('triage_team_data_obj', triage_team_data_obj);
    console.log('user_app_home_state_obj', user_app_home_state_obj);

    // Everything seems to be in order, subscribe to the specified repo
    if (subscribe_repo_obj !== null) {
      try {
        /* TODO HIGHEST when the user subscribes to a new repo, we immediately 
        grab all the untriaged cards in any/all projects they have + the columns 
        of said projects + the repo labels */

        console.log('2 subscribe_repo_obj', subscribe_repo_obj);

        current_subscribed_repos.set(subscribe_repo_obj.repo_path, subscribe_repo_obj);

        console.log('1 user_app_home_state_obj', user_app_home_state_obj);

        // Success! Message the user
        try {
          await app.client.chat.postMessage({
            token: context.botToken,
            channel: slack_user_id,
            // TODO Check if mentions are setup and change the message based on that
            text: `<@${slack_user_id}>, you've successfully subscribed to *${subscribe_repo_obj.repo_path}*. Make sure you set up the *New Issue defaults* for this repo using the global shortcut so that I can automatically assign newly-created issues to a project and column of your choice as soon as they are created!`,
            blocks: Messages.SetupRepoDefaultsMessage(
              slack_user_id,
              subscribe_repo_obj.repo_path
            ),
          });
        } catch (error) {
          console.error(error);
        }
      } catch (err) {
        console.error(err);
      }
    }
    console.log('56 triage_team_data_obj', triage_team_data_obj);
    console.log('here current_subscribed_repos', current_subscribed_repos);
    console.log('5 subscribe_repo_obj', subscribe_repo_obj);
  });
};
