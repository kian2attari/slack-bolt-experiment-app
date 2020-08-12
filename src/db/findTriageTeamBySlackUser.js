const {connectToMongoCollection} = require('./dbConnection');

async function findTriageTeamBySlackUser(slackUserId, projection = {}) {
  const collection = await connectToMongoCollection();

  const dbUserFilter = {};

  dbUserFilter[`teamMembers.${slackUserId}`] = {$exists: true};

  const options = {projection};

  // Pass option parameters if they were provided
  const userTeamArray = collection.find(dbUserFilter, options).toArray();

  // await client.close();

  return userTeamArray;
}

exports.findTriageTeamBySlackUser = findTriageTeamBySlackUser;
