const {SafeAccess} = require('../../helper-functions');
const {mutation, graphql} = require('../../graphql');
const {findTriageTeamBySlackUser} = require('../../db');

module.exports = app => {
  app.action('assign_label', async ({ack, body}) => {
    await ack();

    try {
      const actionBody = body.actions[0];

      console.log('body payload', actionBody);

      const {
        selected_options: selectedOptions,
        initial_options: initialOptions,
      } = actionBody;
      console.log(': ----------------------------------');
      console.log('selected_options', selectedOptions);
      console.log(': ----------------------------------');

      console.log(': --------------------------------');
      console.log('initial_options', initialOptions);
      console.log(': --------------------------------');

      const initialLabelIds = initialOptions // Only if there are initial options
        ? initialOptions.map(option => {
            return JSON.parse(option.value)[0];
          })
        : [];

      const selectedLabelIds = selectedOptions
        ? selectedOptions.map(option => {
            return JSON.parse(option.value)[0];
          })
        : [];

      console.log(': --------------------------------');
      console.log('selected_label_ids', selectedLabelIds);
      console.log(': --------------------------------');

      console.log(': --------------------------------');
      console.log('initial_label_ids', initialLabelIds);
      console.log(': --------------------------------');

      // ES6 doesn't have a set/arrau difference operator, so this just find the symmetric difference between the two
      const labelsToDelete = initialLabelIds.filter(
        initialLabel => !selectedLabelIds.includes(initialLabel)
      );

      const labelsToAdd = selectedLabelIds.filter(
        selectedLabel => !initialLabelIds.includes(selectedLabel)
      );

      console.log('labels to add', labelsToAdd);

      console.log('labels to remove', labelsToDelete);
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

      const teamDataResponse = await findTriageTeamBySlackUser(body.user.id, {
        gitwaveGithubAppInstallationId: 1,
      });

      const installationId = teamDataResponse[0].gitwaveGithubAppInstallationId;
      /* The card_id is the same for all labels, so we just grab it from the first initial or selected option. One of them has to be there
          otherwise there wouldn't have been a symmetric difference. */
      const cardId =
        SafeAccess(() => JSON.parse(selectedOptions[0].value)[1]) ||
        SafeAccess(() => JSON.parse(initialOptions[0].value)[1]);

      if (labelsToDelete.length !== 0) {
        const variablesRemoveLabels = {
          labelableId: cardId,
          labelIds: labelsToDelete,
        };

        // TODO don't clear the labels, use removeLabelsFromLabelable to remove the unwanted labels so that Triage labels arent removed
        await graphql.callGhGraphql(
          mutation.removeLabels,
          variablesRemoveLabels,
          installationId
        );
      }

      if (labelsToAdd.length !== 0) {
        const variablesClearAllLabels = {
          elementNodeId: cardId,
        };

        const variablesAddLabelToIssue = {
          labelIds: labelsToAdd,
          ...variablesClearAllLabels,
        };

        if (selectedLabelIds.length !== 0) {
          // // REVIEW should I await the second one?
          // await graphql.callGhGraphql(
          //   mutation.clearAllLabels,
          //   variables_clearAllLabels,
          //   installation_id
          // );
          await graphql.callGhGraphql(
            mutation.addLabelToIssue,
            variablesAddLabelToIssue,
            installationId
          );

          // If successful, make sure to pull the new labels/change their state in the object. Tho it's best to rely on the webhooks
        }
      }
    } catch (err) {
      console.error(err);
    }
  });
};
