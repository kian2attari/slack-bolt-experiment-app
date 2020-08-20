const {connectToMongoCollection} = require('./dbConnection');

async function findDocuments(filter, projection, collectionName = 'gitwave_team_data') {
  const collection = await connectToMongoCollection(collectionName);

  const userTeamArray = await collection.find(filter, {projection}).toArray();

  return userTeamArray;
}

exports.findDocuments = findDocuments;
