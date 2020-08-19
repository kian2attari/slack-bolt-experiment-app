const {MongoClient} = require('mongodb');

let dbClient = null;
let collection = null;
const url = process.env.DB_URI;
const options = {
  useUnifiedTopology: true,
};
// TODO The team members object in the db should only be an array of slack user ids of people in the team. The actual mappings should be stored in the 'gitwave_user_data' collection
async function connectToMongoCollection(collectionToConnectTo = 'gitwave_team_data') {
  if (collection) return collection;
  try {
    dbClient = await MongoClient.connect(url, options);
    console.log('DB Client ready! Successfully connected successfully to MongoDB!');
  } catch (error) {
    console.error(error);
  }
  collection = dbClient.db().collection(collectionToConnectTo);
  return collection;
}

exports.connectToMongoCollection = connectToMongoCollection;
