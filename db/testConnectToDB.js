const {MongoClient} = require('mongodb');

// Connection URL
const url = process.env.MONGODB_URI;

// TODO: convert to an async function
async function test_connect() {
  // Create a new MongoClient
  const client = new MongoClient(url, {useUnifiedTopology: true});

  // Use connect method to connect to the Server
  await client.connect();
  console.log('Connected successfully to DB server');
  await client.close();
}

exports.test_connect = test_connect;
