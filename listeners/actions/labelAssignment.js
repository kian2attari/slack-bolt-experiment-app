const {SafeAccess} = require('../../helper-functions');
const {mutation, graphql} = require('../../graphql');
const {find_documents} = require('../../db');

module.exports = (app, triage_team_data_obj, user_app_home_state_obj) => {
  app.action('assign_label', async ({ack, body}) => {
    await ack();

    try {
      const action_body = body.actions[0];

      console.log('body payload', action_body);

      const {selected_options} = action_body;
      console.log(': ----------------------------------');
      console.log('selected_options', selected_options);
      console.log(': ----------------------------------');

      const {initial_options} = action_body;
      console.log(': --------------------------------');
      console.log('initial_options', initial_options);
      console.log(': --------------------------------');

      const initial_label_names = initial_options.map(option => {
        return option.text.text;
      });

      const selected_label_names = selected_options.map(option => {
        return option.text.text;
      });

      console.log(': --------------------------------');
      console.log('selected_label_names', selected_label_names);
      console.log(': --------------------------------');

      console.log(': --------------------------------');
      console.log('initial_label_names', initial_label_names);
      console.log(': --------------------------------');

      // ES6 doesn't have a set/arrau difference operator, so this just find the symmetric difference between the two
      const label_difference = initial_label_names
        .filter(initial_label => !selected_label_names.includes(initial_label))
        .concat(
          selected_label_names.filter(
            selected_label => !initial_label_names.includes(selected_label)
          )
        );

      // TODO compare the selected_label_ids to the actual label_ids of the card. If they are different, do stuff below
      if (label_difference.length !== 0) {
        const db_user_filter = {};

        db_user_filter[`team_members.${body.user.id}`] = {$exists: true};
        const db_query = await find_documents(db_user_filter, {
          gitwave_github_app_installation_id: 1,
        });

        const installation_id = db_query[0].gitwave_github_app_installation_id;
        /* The card_id is the same for all labels, so we just grab it from the first initial or selected option. One of them has to be there
            otherwise there wouldn't have been a symmetric difference. */
        const card_id =
          SafeAccess(() => selected_options[0].value) ||
          SafeAccess(() => initial_options[0].value);

        const variables_clearAllLabels = {
          element_node_id: card_id,
        };

        // clear the current labels first
        await graphql.call_gh_graphql(
          mutation.clearAllLabels,
          variables_clearAllLabels,
          installation_id
        );

        const repo_labels_map = triage_team_data_obj.get_team_repo_subscriptions(
          user_app_home_state_obj.get_selected_repo_path()
        ).repo_label_map;

        const selected_label_ids = selected_label_names.map(
          label_name => repo_labels_map.get(label_name).id
        );

        console.log(': --------------------------------');
        console.log('repo_labels_map', repo_labels_map);
        console.log(': --------------------------------');

        console.log(': --------------------------------');
        console.log('selected_label_ids', selected_label_ids);
        console.log(': --------------------------------');

        const variables_addLabelToIssue = {
          label_ids: selected_label_ids,
          ...variables_clearAllLabels,
        };

        if (selected_label_ids.length !== 0) {
          // REVIEW should I await the second one?
          await graphql.call_gh_graphql(
            mutation.clearAllLabels,
            variables_clearAllLabels,
            installation_id
          );
          await graphql.call_gh_graphql(
            mutation.addLabelToIssue,
            variables_addLabelToIssue,
            installation_id
          );

          // If successful, make sure to pull the new labels/change their state in the object. Tho it's best to rely on the webhooks
        }
      }
    } catch (err) {
      console.error(err);
    }
  });
};
