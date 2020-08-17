const {MongoClient} = require('mongodb');

let dbClient = null;
let collection = null;
const url = process.env.DB_URI;
const options = {
  useUnifiedTopology: true,
};

async function connectToMongoCollection() {
  if (collection) return collection;
  try {
    dbClient = await MongoClient.connect(url, options);
    console.log('DB Client ready! Successfully connected successfully to MongoDB!');
  } catch (error) {
    console.error(error);
  }
  collection = dbClient.db().collection('gitwave_team_data');
  return collection;
}

exports.connectToMongoCollection = connectToMongoCollection;
