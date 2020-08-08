const {connectToMongoCollection} = require('./dbConnection');

// Takes in an installation event directly from the github webhook
async function add_new_document(new_document_obj) {
  const collection = await connectToMongoCollection();

  const insert_result = await collection.insertOne(new_document_obj);

  return insert_result;
}

exports.add_new_document = add_new_document;
