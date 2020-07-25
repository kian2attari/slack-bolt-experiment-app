const {MongoClient} = require('mongodb');
const assert = require('assert');

// Connection URL
const url = process.env.MONGODB_URI;

// Create a new MongoClient
const client = new MongoClient(url, {useUnifiedTopology: true});

function test_connect() {
  // Use connect method to connect to the Server
  client.connect(err => {
    assert.equal(null, err);
    console.log('Connected successfully to DB server');

    client.close();
  });
}

exports.test_connect = test_connect;
