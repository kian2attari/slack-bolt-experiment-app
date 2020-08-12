const {connectToMongoCollection} = require('./dbConnection');

async function updateDocument(filter, updateObj, updateOperator = '$set') {
  const collection = await connectToMongoCollection();

  const addNewOperation = {};

  addNewOperation[updateOperator] = updateObj;

  // Update a single document
  return collection.updateOne(filter, addNewOperation);
}

exports.updateDocument = updateDocument;
