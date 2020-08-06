const {Modals} = require('../../blocks');
const {
  show_untriaged_cards,
  update_internal_triage_status_in_db,
  show_triaged_cards,
} = require('../commonFunctions');
const {find_triage_team_by_slack_user} = require('../../db');
const {add_labels_to_card, get_github_username_by_user_id} = require('../../models');
const {SafeAccess} = require('../../helper-functions');
const {reg_exp} = require('../../constants');

/** @param {App} app */
async function open_map_modal_button(app) {
  app.action('open_map_modal_button', async ({ack, body, context, client}) => {
    // Here we acknowledge receipt
    await ack();

    const {trigger_id} = body;

    const user_slack_id = body.user.id;

    const user_set_github_username = await get_github_username_by_user_id(user_slack_id);

    console.log(
      'open_map_modal_button user_set_github_username',
      user_set_github_username
    );

    // User has set a github username
    if (user_set_github_username === null) {
      await client.views.open({
        token: context.botToken,
        trigger_id,
        view: Modals.UsernameMapModal(),
      });
    } else {
      await client.views.open({
        token: context.botToken,
        trigger_id,
        view: Modals.UsernameMapModal(user_set_github_username),
      });
    }
  });
}
// OLD and should be removed
// function open_set_repo_defaults_modal_button(app) {
//   app.action(
//     'open_set_repo_defaults_modal_button',
//     async ({ack, body, context, client}) => {
//       // Here we acknowledge receipt
//       await ack();

//       // TODO: Check the value of the button, if it specifies a repo then set the repo_path
//       const selected_repo = {repo_path: undefined};

//       const {trigger_id} = body;

//       await client.views.open({
//         token: context.botToken,
//         trigger_id,
//         view: Modals.SetupRepoNewIssueDefaultsModal(selected_repo),
//       });
//     }
//   );
// }

function show_untriaged_filter_button(app) {
  // The app home 'Untriaged' filter button
  app.action('show_untriaged_filter_button', async ({ack, body, context, client}) => {
    // Here we acknowledge receipt
    await ack();

    await show_untriaged_cards({
      body,
      context,
      client,
    });
  });
}
// All the cards in the To Do column that have been triaged but not assigned
// TODO this should also show all untriaged internal issues since they are also technically up for grabs
function show_up_for_grabs_filter_button(app) {
  app.action('show_up_for_grabs_filter_button', async ({ack, body, context, client}) => {
    await ack();
    // Only get internal issues that havent been claimed!
    const internal_issue_filter_callback_generator = false;

    // Only issues/PR's that are triaged!
    const external_card_filter_callback_generator = () => card =>
      card.content.labels.nodes.some(label =>
        reg_exp.find_triage_labels.test(label.description)
      );

    try {
      await show_triaged_cards(
        {body, context, client},
        'show_up_for_grabs_filter_button',
        internal_issue_filter_callback_generator,
        external_card_filter_callback_generator,
        'To Do',
        false
      );
    } catch (error) {
      console.error(error);
    }
  });
}
// All cards in the In Progress Column that are assigned to the user
function show_assigned_to_user_filter_button(app) {
  app.action(
    'show_assigned_to_user_filter_button',
    async ({ack, body, context, client}) => {
      await ack();

      const internal_issue_filter_callback_generator = user_id => internal_issue =>
        // SafeAccess is used because untriaged issues don't have issue_triage_data
        /* REVIEW it's probably better to set up the DB so that untriaged internal issues and triaged internal issues are in separate objects. Every internal issue that gets triaged is
       moved to the triaged internal issues section. That way, this complex filtering wont be necessary. */
        SafeAccess(() => internal_issue.issue_triage_data.acting_team_member_user_id) ===
          user_id && internal_issue.issue_triage_data.status === 'seen';

      const external_card_filter_callback_generator = user_github_username => card =>
        card.content.assignees.nodes.some(user => {
          console.log('is_equal?', user.login === user_github_username);
          return user.login === user_github_username;
        });

      try {
        await show_triaged_cards(
          {body, context, client},
          'show_assigned_to_user_filter_button',
          internal_issue_filter_callback_generator,
          external_card_filter_callback_generator,
          'In Progress',
          false
        );
      } catch (error) {
        console.error(error);
      }
    }
  );
}

// All cards in the Done Column that are assigned to the user
function show_done_by_user_filter_button(app) {
  app.action('show_done_by_user_filter_button', async ({ack, body, context, client}) => {
    await ack();

    const internal_issue_filter_callback_generator = user_id => internal_issue =>
      // SafeAccess is used because untriaged issues don't have issue_triage_data
      /* REVIEW it's probably better to set up the DB so that untriaged internal issues and triaged internal issues are in separate objects. Every internal issue that gets triaged is
   moved to the triaged internal issues section. That way, this complex filtering wont be necessary. */
      SafeAccess(() => internal_issue.issue_triage_data.acting_team_member_user_id) ===
        user_id && internal_issue.issue_triage_data.status === 'done';

    const external_card_filter_callback_generator = user_github_username => card =>
      card.content.assignees.nodes.some(user => user.login === user_github_username) &&
      card.content.closed;

    try {
      await show_triaged_cards(
        {body, context, client},
        'show_done_by_user_filter_button',
        internal_issue_filter_callback_generator,
        external_card_filter_callback_generator,
        'Done',
        true
      );
    } catch (error) {
      console.error(error);
    }
  });
}

function app_home_external_triage_buttons(app) {
  // EXTRA_TODO autogenerate this list based on the triage labels for a repo
  // EXTRA_TODO the internal and external button setup have a lot in common, pull that into a common function
  const external_triage_buttons = [
    'assign_bug_label',
    'assign_tests_label',
    'assign_discussion_label',
    'assign_docs_label',
    'assign_enhancement_label',
    'assign_question_label',
  ];

  external_triage_buttons.forEach(button =>
    app.action(button, async ({ack, body}) => {
      await ack();

      await add_labels_to_card(body.user.id, JSON.parse(body.actions[0].value));
    })
  );
}

function app_home_internal_triage_buttons(app) {
  const internal_triage_buttons = new Map([
    ['assign_eyes_label', 'is looking :eyes: into this!'],
    ['assign_checkmark_label', 'has resolved :white_check_mark: this!'],
  ]);

  internal_triage_buttons.forEach((response_text, button) =>
    app.action(button, async ({ack, body, context, client}) => {
      await ack();

      const {
        user: {id: reacting_user_id},
        actions,
      } = body;

      // EXTRA_TODO turn this find channel id query into its own function perhaps
      const response = await find_triage_team_by_slack_user(reacting_user_id, {
        team_internal_triage_channel_id: 1,
      });

      const {team_internal_triage_channel_id} = response[0];

      const {name, message_ts: timestamp} = JSON.parse(actions[0].value);
      try {
        await Promise.all([
          client.reactions.add({
            token: context.botToken,
            channel: team_internal_triage_channel_id, // Review is there a better way to get this id?
            name,
            timestamp,
          }),
          client.chat.postMessage({
            token: context.botToken,
            channel: team_internal_triage_channel_id, // Review is there a better way to get this id?
            thread_ts: timestamp,
            text: `<@${reacting_user_id}> ${response_text}`,
          }),
          update_internal_triage_status_in_db({
            user: reacting_user_id,
            reaction: button === 'assign_eyes_label' ? 'eyes' : 'white_check_mark',
            event_ts: actions[0].action_ts,
            channel: team_internal_triage_channel_id,
            issue_message_ts: timestamp,
          }),
        ]);
      } catch (error) {
        console.error(error);
      }
    })
  );
}

// Acknowledges arbitrary button clicks (ex. open a link in a new tab)
function link_button(app) {
  app.action('link_button', async ({ack}) => {
    console.log('link button pressed!');
    ack();
  });
}

module.exports = {
  open_map_modal_button,
  show_untriaged_filter_button,
  link_button,
  show_up_for_grabs_filter_button,
  show_assigned_to_user_filter_button,
  show_done_by_user_filter_button,
  app_home_external_triage_buttons,
  app_home_internal_triage_buttons,
};
