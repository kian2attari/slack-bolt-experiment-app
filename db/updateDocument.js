const {Connection} = require('./dbConnection');

async function update_document(filter, update_obj) {
  const collection = await Connection.connectToMongoCollection();

  const add_new_operation = {
    $set: update_obj,
  };

  // Update a single document
  return collection.updateOne(filter, add_new_operation);
}

exports.update_document = update_document;
