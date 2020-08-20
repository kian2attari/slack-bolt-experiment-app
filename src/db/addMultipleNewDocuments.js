const {connectToMongoCollection} = require('./dbConnection');

async function addMultipleNewDocuments(
  newDocumentObjArray,
  collectionName = 'gitwave_user_data'
) {
  const collection = await connectToMongoCollection(collectionName);

  const insertResult = await collection.insertMany(newDocumentObjArray);

  return insertResult;
}

exports.addMultipleNewDocuments = addMultipleNewDocuments;
