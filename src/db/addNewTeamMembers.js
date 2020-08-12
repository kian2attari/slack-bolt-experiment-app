const {connectToMongoCollection} = require('./dbConnection');
const {reduceArrayToObj} = require('../helper-functions');

async function addNewTeamMembers(slackUserIds, teamChannelId) {
  const collection = await connectToMongoCollection();

  // TODO update this to work like how addNewTriageTeam works. This model is old.

  const newTeamMembersObj = reduceArrayToObj(slackUserIds);

  const addNewIssueOperation = {
    $set: newTeamMembersObj,
  };

  const insertResult = await collection.insertOne(
    {teamDiscussionChannelId: teamChannelId},
    addNewIssueOperation
  );

  console.log(
    ': --------------------------------------------------------------------------'
  );
  console.log('add_new_team_members -> insert_result', insertResult);
  console.log(
    ': --------------------------------------------------------------------------'
  );

  return insertResult;
}

exports.addNewTeamMembers = addNewTeamMembers;
