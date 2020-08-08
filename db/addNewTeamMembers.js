const {connectToMongoCollection} = require('./dbConnection');
const {reduce_array_to_obj} = require('../helper-functions');

async function add_new_team_members(slack_user_ids, team_channel_id) {
  const collection = await connectToMongoCollection();

  // TODO update this to work like how addNewTriageTeam works. This model is old.

  const new_team_members_obj = reduce_array_to_obj(slack_user_ids);

  const add_new_issue_operation = {
    $set: new_team_members_obj,
  };

  const insert_result = await collection.insertOne(
    {team_discussion_channel_id: team_channel_id},
    add_new_issue_operation
  );

  console.log(
    ': --------------------------------------------------------------------------'
  );
  console.log('add_new_team_members -> insert_result', insert_result);
  console.log(
    ': --------------------------------------------------------------------------'
  );

  return insert_result;
}

exports.add_new_team_members = add_new_team_members;
