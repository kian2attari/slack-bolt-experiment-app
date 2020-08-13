const {findTriageTeamBySlackUser} = require('../../db');
const {
  SubBlocks: {optionObj},
} = require('../../blocks');

function assignableTeamMembers(app) {
  app.options('assignable_team_members', async ({options, ack}) => {
    const userId = options.user.id;

    try {
      const {teamMembers} = (
        await findTriageTeamBySlackUser(userId, {
          teamMembers: 1,
        })
      )[0];
      /* Note: I use the <@user_id> mention convention here so that the client will automatically 
      convert the slack user IDs. Since this is being done in a select menu and not in a message, 
      none of the users are actually mentioned! This method also has the added advantage of automatically
      highlighting the name of the user who clicked on the select menu. The alternative to this method
      would be calling the users.identity method on Slack API for every user and getting their names that way. 
      Ideally if you go this route, modify the DB model so that the user's display name is stored there. */

      const assignableUserArray = Object.keys(teamMembers).reduce(
        (assignableUsers, slackUserId) => {
          if (teamMembers[slackUserId].githubUserData.githubUsername !== null)
            assignableUsers.push(`<@${slackUserId}>`);
          return assignableUsers;
        },
        []
      );

      const assignableUserOptions = assignableUserArray.map(slackUserId =>
        optionObj(slackUserId)
      );

      await ack({
        options: assignableUserOptions,
      });
    } catch (error) {
      console.error(error);
      await ack({
        options: [],
      });
    }
  });
}

exports.assignableTeamMembers = assignableTeamMembers;
