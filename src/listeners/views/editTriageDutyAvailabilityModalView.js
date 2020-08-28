const {setTriageDutyAssignments} = require('../../models');
const {shuffleArray} = require('../../helper-functions');

exports.editTriageDutyAvailabilityModal = app => {
  app.view('edit_triage_duty_availability_modal', async ({ack, body, view, context}) => {
    // Acknowledge the view_submission event
    await ack();

    const slackUserId = body.user.id;

    const triageDutyAssignmentsObjArray = JSON.parse(view.private_metadata);

    console.log('triageDutyAssignmentsObjArray received', triageDutyAssignmentsObjArray);

    const availabilitySelections = Object.values(view.state.values).reduce(
      (accum, selection) =>
        accum.concat([
          JSON.parse(selection.triage_duty_availability_radio.selected_option.value),
        ]),
      []
    );

    console.log('availability_selections', availabilitySelections);

    let currentWeekAssignmentChange = false;

    availabilitySelections.forEach((availabilitySelection, index) => {
      if (availabilitySelection.avail === availabilitySelection.wasAvail) {
        return;
      }
      const assignmentWeek = triageDutyAssignmentsObjArray[index];
      const {assignedTeamMember, substitutes} = assignmentWeek;

      if (assignedTeamMember === slackUserId) {
        currentWeekAssignmentChange = index === 0;
        // Replacing with a substitute
        triageDutyAssignmentsObjArray[index].assignedTeamMember = substitutes.pop();
        return;
      }
      // We add or remove the user from the list of substitutes depending on whether they changed their availability to available or not
      triageDutyAssignmentsObjArray[index].substitutes = availabilitySelection.avail
        ? shuffleArray(substitutes.concat(slackUserId)) // The shuffling is done so that marking yourself as available won't guarantee you'll be assigned
        : substitutes.filter(teamMember => teamMember !== slackUserId);
    });

    console.log('updated triageDutyAssignmentsObjArray', triageDutyAssignmentsObjArray);

    // Success! Message the user
    try {
      await setTriageDutyAssignments(
        null,
        triageDutyAssignmentsObjArray,
        app,
        currentWeekAssignmentChange,
        slackUserId
      );
      await app.client.chat.postMessage({
        token: context.botToken,
        // EXTRA_TODO message the user telling them what weeks they're up/not up for anymore
        channel: slackUserId,
        text: `Hi <@${slackUserId}>, your new availability has been received!`,
      });
    } catch (error) {
      console.error(error);
      await app.client.chat.postMessage({
        token: context.botToken,
        channel: slackUserId,
        text: `Hi <@${slackUserId}>, I had trouble setting your availability. Please try again.`,
      });
    }
  });
};
