const {Connection} = require('./dbConnection');

async function find_documents(filter, projection) {
  const collection = await Connection.connectToMongoCollection();

  const user_team_array = await collection.find(filter, {projection}).toArray();

  return user_team_array;
}

exports.find_documents = find_documents;
