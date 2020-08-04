const {Connection} = require('./dbConnection');

async function find_triage_team_by_slack_user(slack_user_id, projection = {}) {
  const collection = await Connection.connectToMongoCollection();

  const db_user_filter = {};

  db_user_filter[`team_members.${slack_user_id}`] = {$exists: true};

  const options = {projection};

  // Pass option parameters if they were provided
  const user_team_array = collection.find(db_user_filter, options).toArray();

  // await client.close();

  return user_team_array;
}

exports.find_triage_team_by_slack_user = find_triage_team_by_slack_user;
