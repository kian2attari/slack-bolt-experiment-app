const {connectToMongoCollection} = require('./dbConnection');
const {reg_exp} = require('../constants');

/**
 * @param {{
 *   team_internal_triage_channel_id: String;
 *   internal_triage_item: {
 *     text: String;
 *     user: String;
 *     urgency: String;
 *     issue_message_ts: String;
 *   };
 * }} new_issue_obj
 */
// eslint-disable-next-line consistent-return
async function add_new_internal_issue(new_issue_message_obj) {
  // Use connect method to connect to the Server
  try {
    const collection = await connectToMongoCollection();

    console.log('collection', collection);

    const team_query = {
      team_internal_triage_channel_id:
        new_issue_message_obj.team_internal_triage_channel_id,
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
    return collection.updateOne(team_query, push_new_value);
    // Update a single document
  } catch (error) {
    console.error(error);
  }
}

exports.add_new_internal_issue = add_new_internal_issue;
