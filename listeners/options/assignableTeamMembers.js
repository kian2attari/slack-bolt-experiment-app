const {find_triage_team_by_slack_user} = require('../../db');
const {
  SubBlocks: {option_obj},
} = require('../../blocks');

function assignable_team_members(app) {
  app.options('assignable_team_members', async ({options, ack}) => {
    const user_id = options.user.id;

    try {
      const {team_members} = (
        await find_triage_team_by_slack_user(user_id, {
          team_members: 1,
        })
      )[0];
      /* Note: I use the <@user_id> mention convention here so that the client will automatically 
      convert the slack user IDs. Since this is being done in a select menu and not in a message, 
      none of the users are actually mentioned! This method also has the added advantage of automatically
      highlighting the name of the user who clicked on the select menu. The alternative to this method
      would be calling the users.identity method on Slack API for every user and getting their names that way. 
      Ideally if you go this route, modify the DB model so that the user's display name is stored there. */

      const assignable_user_array = Object.keys(team_members).reduce(
        (assignable_users, slack_user_id) => {
          if (team_members[slack_user_id] !== null)
            assignable_users.push(`<@${slack_user_id}>`);
          return assignable_users;
        },
        []
      );

      const assignable_user_options = assignable_user_array.map(slack_user_id =>
        option_obj(slack_user_id)
      );

      await ack({
        options: assignable_user_options,
      });
    } catch (error) {
      console.error(error);
      await ack({
        options: [],
      });
    }
  });
}

exports.assignable_team_members = assignable_team_members;
