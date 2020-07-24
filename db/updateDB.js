const {MongoClient} = require('mongodb');
const assert = require('assert');

// Connection URL
const url = process.env.MONGODB_URI;

// Create a new MongoClient
const client = new MongoClient(url, {useUnifiedTopology: true});

// Database Name
const dbName = process.env.MONGODB_NAME;
/**
 *
 *
 * @param {{internal_triage_channel_id: String, internal_triage_item:{conversation_id: String, slack_ts: String, urgency: String, created_at: String, seen: Boolean}}} update_obj
 */
function update_one_in_DB(update_obj) {
  // Use connect method to connect to the Server
  client.connect(err => {
    assert.equal(null, err);
    console.log('Connected correctly to server');

    const db_obj = client.db(dbName);

    console.log('db_obj', db_obj);

    const team_query = {
      internal_triage_channel_id: update_obj.internal_triage_channel_id,
    };

    console.log('team query', team_query);

    const push_new_value = {
      $push: {internal_triage_items: update_obj.internal_triage_item},
    };

    // Update a single document
    db_obj
      .collection('gitwave_team_data')
      .updateOne(team_query, push_new_value, (error, response) => {
        assert.equal(null, error);
        console.log('success response', response);
      });
  });
}

exports.update_one_in_DB = update_one_in_DB;
