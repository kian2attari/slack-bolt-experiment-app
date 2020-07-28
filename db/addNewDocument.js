const {MongoClient} = require('mongodb');

// Connection URL
const url = process.env.MONGODB_URI;

// Database Name
const dbName = process.env.MONGODB_NAME;

// Takes in an installation event directly from the github webook
async function add_new_document(new_document_obj) {
  // Create a new MongoClient
  const client = new MongoClient(url, {useUnifiedTopology: true});

  // Use connect method to connect to the Server
  await client.connect();
  console.log('Connected successfully to DB server');
  const collection = client.db(dbName).collection('gitwave_team_data');

  const insert_result = await collection.insertOne(new_document_obj);

  await client.close();

  return insert_result;
}

exports.add_new_document = add_new_document;
