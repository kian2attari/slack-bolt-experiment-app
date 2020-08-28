const {addMultipleNewDocuments, findDocuments, updateDocument} = require('../db');

async function addNewUsers(slackUserIdArray) {
  const newUserObjArray = slackUserIdArray.map(userId => ({
    slackUserId: userId,
    githubUsername: null,
  }));

  return addMultipleNewDocuments(newUserObjArray);
}

/**
 * Get team members' GitHub usernames by their Slack user IDs
 *
 * @param {[String]} slackUserIds
 * @returns {[{}]} The team member Object
 */
async function getGithubUsernamesFromSlackUserIds(slackUserIds) {
  // First we check to see if the user has already mapped a github username
  const triageTeamMembersResponse = await findDocuments(
    {slackUserId: {'$in': slackUserIds}},
    {
      githubUsername: 1,
      slackUserId: 1,
      githubUserId: 1,
    },
    'gitwave_user_data'
  );

  console.log('triageTeamMembersResponse', triageTeamMembersResponse);

  return triageTeamMembersResponse;
}
// TODO just use getGithubUsernamesFromSlackUserIds to do this
async function getGithubUserIdsFromSlackUserIds(slackUserIds) {
  // First we check to see if the user has already mapped a github username
  const triageTeamMembersResponse = await findDocuments(
    {slackUserId: {'$in': slackUserIds}},
    {
      githubUserId: 1,
      slackUserId: 1,
    },
    'gitwave_user_data'
  );

  const githubUserIdResult =
    slackUserIds.length === 1
      ? triageTeamMembersResponse[0].githubUserId
      : triageTeamMembersResponse;

  return githubUserIdResult;
}

async function updateUserObj(slackUserId, newData) {
  await updateDocument({slackUserId}, newData, '$set', 'gitwave_user_data');
}

exports.gitwaveUserData = {
  addNewUsers,
  getGithubUsernamesFromSlackUserIds,
  updateUserObj,
  getGithubUserIdsFromSlackUserIds,
};
