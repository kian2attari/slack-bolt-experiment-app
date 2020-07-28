const {MongoClient} = require('mongodb');

// Connection URL
const url = process.env.MONGODB_URI;

// Database Name
const dbName = process.env.MONGODB_NAME;

async function update_document(filter, update_obj) {
  // Create a new MongoClient
  const client = new MongoClient(url, {useUnifiedTopology: true});
  // Use connect method to connect to the Server
  await client.connect();
  console.log('Connected correctly to server');

  const db_obj = client.db(dbName).collection('gitwave_team_data');

  const add_new_operation = {
    $set: update_obj,
  };

  // Update a single document
  return db_obj.updateOne(filter, add_new_operation);
}

exports.update_document = update_document;
