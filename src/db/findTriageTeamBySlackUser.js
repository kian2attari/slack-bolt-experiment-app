const {connectToMongoCollection} = require('./dbConnection');

async function findTriageTeamBySlackUser(slackUserId, projection = {}) {
  const collection = await connectToMongoCollection();

  const dbUserFilter = {teamMembers: slackUserId};

  const options = {projection};

  // Pass option parameters if they were provided
  const userTeamArray = await collection.find(dbUserFilter, options).toArray();

  // await client.close();

  return userTeamArray;
}

exports.findTriageTeamBySlackUser = findTriageTeamBySlackUser;
