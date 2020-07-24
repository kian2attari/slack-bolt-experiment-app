const {MongoClient} = require('mongodb');
const assert = require('assert');

// Connection URL
const url = process.env.MONGODB_URI;

// Create a new MongoClient
const client = new MongoClient(url, {useUnifiedTopology: true});

// Database Name
const dbName = process.env.MONGODB_NAME;
function test_connect() {
  // Use connect method to connect to the Server
  client.connect(err => {
    assert.equal(null, err);
    console.log('Connected correctly to server');

    const db_obj = client.db(dbName);

    console.log('db_obj', db_obj);

    client.close();
  });
}

exports.test_connect = test_connect;
