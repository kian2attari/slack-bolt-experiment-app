const {connectToMongoCollection} = require('./dbConnection');

async function updateDocument(
  filter,
  updateObj,
  updateOperator = '$set',
  collectionName = 'gitwave_team_data'
) {
  const collection = await connectToMongoCollection(collectionName);

  const addNewOperation = {};

  addNewOperation[updateOperator] = updateObj;

  // Update a single document
  return collection.updateOne(filter, addNewOperation);
}

exports.updateDocument = updateDocument;
