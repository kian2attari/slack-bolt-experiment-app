exports.editTriageDutyAvailabilityModal = app => {
  app.view('edit_triage_duty_availability_modal', async ({ack, body, view, context}) => {
    // Acknowledge the view_submission event
    await ack();

    const user = body.user.id;

    const availabilitySelections = Object.values(view.state.values).reduce(
      (accum, selection) =>
        accum.concat([
          JSON.parse(selection.triage_duty_availability_radio.selected_option.value),
        ]),
      []
    );

    console.log('availability_selections', availabilitySelections);

    /* TODO loop through the availibility selections. For every case where availability=true, set them as a candidate for that week. 
    If availability = false and the slack_user_id of the assigned person is the same as the user who sent the modal, pick a candidate to replace them */

    // Success! Message the user
    try {
      await app.client.chat.postMessage({
        token: context.botToken,
        // TODO message the whole team not just the user who the project board
        channel: user,
        text: `Hi <@${user}>, you new availability has been received!`,
      });
    } catch (error) {
      console.error(error);
    }
  });
};
