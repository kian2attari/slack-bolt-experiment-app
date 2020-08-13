// const {assignTeamMemberToIssueOrPR} = require('../../models');

function assignTeamMember(app) {
  app.action('assignable_team_members', async ({ack, body, context, client}) => {
    await ack();
    try {
      console.log('body', body);
      const actionBody = body.actions[0];

      const {selected_option: selectedOption} = actionBody;

      const selectedUserToAssign = selectedOption.text.text;

      console.log(': --------------------------------------------------------------');
      console.log('assignTeamMember -> selectedUserToAssign', selectedUserToAssign);
      console.log(': --------------------------------------------------------------');
    } catch (error) {
      console.error(error);
    }
  });
}

exports.assignTeamMember = assignTeamMember;
