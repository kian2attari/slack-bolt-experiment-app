const {MongoClient} = require('mongodb');

// Connection URL
const url = process.env.MONGODB_URI;

// Database Name
const dbName = process.env.MONGODB_NAME;

async function add_new_triage_team_to_db(
  user_id_array,
  team_discussion_channel_id,
  internal_triage_channel_id
) {
  // Create a new MongoClient
  const client = new MongoClient(url, {useUnifiedTopology: true});
  // Use connect method to connect to the Server

  await client.connect();
  console.log('Connected successfully to DB server');

  const collection = await client.db(dbName).collection('gitwave_team_data');

  // TODO turn this into a helper function since add team member does the same thing
  const team_member_obj = user_id_array.reduce((accumulator, currentValue) => {
    accumulator[currentValue] = null;
    return accumulator;
  }, {});

  const new_obj = {
    internal_triage_channel_id,
    team_discussion_channel_id,
    internal_triage_items: {},
    team_members: team_member_obj,
  };

  // Insert a single document
  return collection.insertOne(new_obj);
}

exports.add_new_triage_team_to_db = add_new_triage_team_to_db;
