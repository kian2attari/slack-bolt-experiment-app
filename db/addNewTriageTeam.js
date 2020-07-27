const {MongoClient} = require('mongodb');
const assert = require('assert');

// Connection URL
const url = process.env.MONGODB_URI;

// Create a new MongoClient
const client = new MongoClient(url, {useUnifiedTopology: true});

// Database Name
const dbName = process.env.MONGODB_NAME;

function add_new_triage_team_to_db(internal_triage_channel_id, message_user_callback) {
  // Use connect method to connect to the Server

  client.connect(err => {
    assert.equal(null, err);
    console.log('Connected correctly to server');

    const db_obj = client.db(dbName);

    console.log('db_obj', db_obj);

    const new_obj = {internal_triage_channel_id, internal_triage_items: {}};

    // Insert a single document
    db_obj.collection('gitwave_team_data').insertOne(new_obj, message_user_callback);
  });
}

exports.add_new_triage_team_to_db = add_new_triage_team_to_db;
