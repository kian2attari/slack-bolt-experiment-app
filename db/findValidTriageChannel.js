const {Connection} = require('./dbConnection');

async function find_valid_triage_channel(triage_channel_id) {
  const collection = await Connection.connectToMongoCollection();

  const db_triage_channel_filter = {};

  db_triage_channel_filter.team_internal_triage_channel_id = {$eq: triage_channel_id};

  const user_team_array = collection
    .find(db_triage_channel_filter, {projection: {team_internal_triage_channel_id: 1}})
    .toArray();

  return user_team_array;
}

exports.find_valid_triage_channel = find_valid_triage_channel;
