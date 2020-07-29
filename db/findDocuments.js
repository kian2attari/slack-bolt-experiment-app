const {MongoClient} = require('mongodb');

// Connection URL
const url = process.env.MONGODB_URI;

// Database Name
const dbName = process.env.MONGODB_NAME;

// TODO: convert to an async function
async function find_documents(filter, projection) {
  // Create a new MongoClient
  const client = new MongoClient(url, {useUnifiedTopology: true});

  // Use connect method to connect to the Server
  await client.connect();
  console.log('Connected successfully to DB server');
  const collection = client.db(dbName).collection('gitwave_team_data');

  const user_team_array = await collection.find(filter, {projection}).toArray();

  // await client.close();

  return user_team_array;
}

exports.find_documents = find_documents;
