const {MongoClient} = require('mongodb');

let dbClient = null;
const collections = {'gitwave_team_data': null, 'gitwave_user_data': null};
const url = process.env.DB_URI;
const options = {
  useUnifiedTopology: true,
};
// TODO The team members object in the db should only be an array of slack user ids of people in the team. The actual mappings should be stored in the 'gitwave_user_data' collection
async function connectToMongoCollection(collectionToConnectTo = 'gitwave_team_data') {
  if (collections[collectionToConnectTo]) return collections[collectionToConnectTo];
  try {
    dbClient = await MongoClient.connect(url, options);
    console.log('DB Client ready! Successfully connected successfully to MongoDB!');
  } catch (error) {
    console.error(error);
  }
  collections[collectionToConnectTo] = dbClient.db().collection(collectionToConnectTo);
  return collections[collectionToConnectTo];
}

exports.connectToMongoCollection = connectToMongoCollection;
