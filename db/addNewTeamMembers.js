const {MongoClient} = require('mongodb');
const {reduce_array_to_obj} = require('../helper-functions');

// Connection URL
const url = process.env.MONGODB_URI;

// Database Name
const dbName = process.env.MONGODB_NAME;

// TODO: convert to an async function
async function add_new_team_members(slack_user_ids, team_channel_id) {
  // Create a new MongoClient
  const client = new MongoClient(url, {useUnifiedTopology: true});

  // Use connect method to connect to the Server
  await client.connect();
  console.log('Connected successfully to DB server');
  const collection = client.db(dbName).collection('gitwave_team_data');

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
  console.log('find_triage_team_by_slack_user -> insert_result', insert_result);
  console.log(
    ': --------------------------------------------------------------------------'
  );

  await client.close();

  return insert_result;
}

exports.add_new_team_members = add_new_team_members;
