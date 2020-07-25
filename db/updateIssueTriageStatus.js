const {MongoClient} = require('mongodb');
const assert = require('assert');
const {reg_exp} = require('../constants');

// Connection URL
const url = process.env.MONGODB_URI;

// Create a new MongoClient
const client = new MongoClient(url, {useUnifiedTopology: true});

// Database Name
const dbName = process.env.MONGODB_NAME;
/**
 * @param {{
 *   internal_triage_channel_id: String;
 *   internal_triage_item: {
 *     issue_message_ts: String;
 *     issue_triage_data: {
 *       assigned_team_member_user_id: String;
 *       reaction_last_update_ts: String;
 *       status: String;
 *     };
 *   };
 * }} update_obj
 */
function update_issue_triage_status(update_obj) {
  // Use connect method to connect to the Server
  client.connect(err => {
    assert.equal(null, err);
    console.log('Connected correctly to server');

    const db_obj = client.db(dbName);

    console.log('db_obj', db_obj);

    const team_query = {
      internal_triage_channel_id: update_obj.internal_triage_channel_id,
    };

    const {internal_triage_item} = update_obj;

    console.log('internal_triage_item', internal_triage_item);
    // the dots in the ts will confuse mongo, they need to be replaced with dashes.
    const fixed_format_ts = internal_triage_item.issue_message_ts.replace(
      reg_exp.find_all_dots,
      '_'
    );

    console.log('team query', team_query);
    // Question whats the best way to set multiple views here?
    const update_issue_obj = {};

    const update_issue_obj_property = `internal_triage_items.${fixed_format_ts}.issue_triage_data`;

    update_issue_obj[update_issue_obj_property] = internal_triage_item.issue_triage_data;

    console.log('update issue obj', update_issue_obj);

    const push_new_value = {
      $set: update_issue_obj,
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

exports.update_issue_triage_status = update_issue_triage_status;
