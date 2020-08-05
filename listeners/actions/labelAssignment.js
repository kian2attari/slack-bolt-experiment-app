const {SafeAccess} = require('../../helper-functions');
const {mutation, graphql} = require('../../graphql');
const {find_triage_team_by_slack_user} = require('../../db');

module.exports = app => {
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

      const initial_label_ids = initial_options // Only if there are initial options
        ? initial_options.map(option => {
            return JSON.parse(option.value)[0];
          })
        : [];

      const selected_label_ids = selected_options
        ? selected_options.map(option => {
            return JSON.parse(option.value)[0];
          })
        : [];

      console.log(': --------------------------------');
      console.log('selected_label_ids', selected_label_ids);
      console.log(': --------------------------------');

      console.log(': --------------------------------');
      console.log('initial_label_ids', initial_label_ids);
      console.log(': --------------------------------');

      // ES6 doesn't have a set/arrau difference operator, so this just find the symmetric difference between the two
      const labels_to_delete = initial_label_ids.filter(
        initial_label => !selected_label_ids.includes(initial_label)
      );

      const labels_to_add = selected_label_ids.filter(
        selected_label => !initial_label_ids.includes(selected_label)
      );

      console.log('labels to add', labels_to_add);

      console.log('labels to remove', labels_to_delete);
      // .concat(
      //   selected_label_ids.filter(
      //     selected_label => !initial_label_ids.includes(selected_label)
      //   )
      // );

      // const label_difference = initial_label_ids
      // .filter(initial_label => !selected_label_ids.includes(initial_label))
      // .concat(
      //   selected_label_ids.filter(
      //     selected_label => !initial_label_ids.includes(selected_label)
      //   )
      // );

      const team_data_response = await find_triage_team_by_slack_user(body.user.id, {
        gitwave_github_app_installation_id: 1,
      });

      const installation_id = team_data_response[0].gitwave_github_app_installation_id;
      /* The card_id is the same for all labels, so we just grab it from the first initial or selected option. One of them has to be there
          otherwise there wouldn't have been a symmetric difference. */
      const card_id =
        SafeAccess(() => JSON.parse(selected_options[0].value)[1]) ||
        SafeAccess(() => JSON.parse(initial_options[0].value)[1]);

      if (labels_to_delete.length !== 0) {
        const variables_removeLabels = {
          labelableId: card_id,
          labelIds: labels_to_delete,
        };

        // TODO don't clear the labels, use removeLabelsFromLabelable to remove the unwanted labels so that Triage labels arent removed
        await graphql.call_gh_graphql(
          mutation.removeLabels,
          variables_removeLabels,
          installation_id
        );
      }

      if (labels_to_add.length !== 0) {
        const variables_clearAllLabels = {
          element_node_id: card_id,
        };

        const variables_addLabelToIssue = {
          label_ids: labels_to_add,
          ...variables_clearAllLabels,
        };

        if (selected_label_ids.length !== 0) {
          // // REVIEW should I await the second one?
          // await graphql.call_gh_graphql(
          //   mutation.clearAllLabels,
          //   variables_clearAllLabels,
          //   installation_id
          // );
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
