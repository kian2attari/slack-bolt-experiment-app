const {connectToMongoCollection} = require('./dbConnection');

async function findDocuments(filter, projection) {
  const collection = await connectToMongoCollection();

  const userTeamArray = await collection.find(filter, {projection}).toArray();

  return userTeamArray;
}

exports.findDocuments = findDocuments;
