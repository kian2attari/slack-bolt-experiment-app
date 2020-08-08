const {connectToMongoCollection} = require('./dbConnection');

async function update_document(filter, update_obj, update_operator = '$set') {
  const collection = await connectToMongoCollection();

  const add_new_operation = {};

  add_new_operation[update_operator] = update_obj;

  // Update a single document
  return collection.updateOne(filter, add_new_operation);
}

exports.update_document = update_document;
