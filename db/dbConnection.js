const {MongoClient} = require('mongodb');

let db_client = null;
let collection = null;
const url = process.env.MONGODB_URI;
const options = {
  useUnifiedTopology: true,
};

async function connectToMongoCollection() {
  if (collection) return collection;
  try {
    db_client = await MongoClient.connect(url, options);
    console.log('DB Client ready! Successfully connected successfully to MongoDB!');
  } catch (error) {
    console.error(error);
  }
  collection = db_client.db().collection('gitwave_team_data');
  return collection;
}

// TODO just export the function, not this Object

exports.connectToMongoCollection = connectToMongoCollection;
