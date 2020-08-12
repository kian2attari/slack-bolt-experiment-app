const {connectToMongoCollection} = require('./dbConnection');

// Takes in an installation event directly from the github webhook
async function addNewDocument(newDocumentObj) {
  const collection = await connectToMongoCollection();

  const insertResult = await collection.insertOne(newDocumentObj);

  return insertResult;
}

exports.addNewDocument = addNewDocument;
