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
 *     text: String;
 *     user: String;
 *     urgency: String;
 *     issue_message_ts: String;
 *   };
 * }} new_issue_obj
 */
function add_new_internal_issue(new_issue_message_obj) {
  // Use connect method to connect to the Server
  client.connect(err => {
    assert.equal(null, err);

    const db_obj = client.db(dbName).collection('gitwave_team_data');

    console.log('db_obj', db_obj);

    const team_query = {
      internal_triage_channel_id: new_issue_message_obj.internal_triage_channel_id,
    };

    // TODO if this query returns nothing, then send a message to the user with an error! The team hasn't set a traige channel

    console.log('team query', team_query);

    const {internal_triage_item} = new_issue_message_obj;
    // the dots in the ts will confuse mongo, they need to be replaced with dashes.
    const fixed_format_ts = internal_triage_item.issue_message_ts.replace(
      reg_exp.find_all_dots,
      '_'
    );

    const new_issue_obj = {};

    const new_issue_obj_property = `internal_triage_items.${fixed_format_ts}`;

    new_issue_obj[new_issue_obj_property] = internal_triage_item;

    console.log('add new internal issue', new_issue_obj);

    const push_new_value = {
      $set: new_issue_obj,
    };
    // Update a single document

    db_obj.updateOne(team_query, push_new_value, (error, response) => {
      assert.equal(null, error);
      const was_added = response.result.n === 1;
      console.log('Was the issue added successfully? :', was_added);
      // REVIEW how can i return was_added to use is updateIssueTriage
      if (!was_added) {
        throw Error(
          'Failed to store message in DB! Did you assign the triage team to the right channel?'
        );
      }
    });
  });
}

exports.add_new_internal_issue = add_new_internal_issue;
