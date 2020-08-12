const {connectToMongoCollection} = require('./dbConnection');

async function findValidTriageChannel(triageChannelId) {
  const collection = await connectToMongoCollection();

  const dbTriageChannelFilter = {};

  dbTriageChannelFilter.teamInternalTriageChannelId = {$eq: triageChannelId};

  const userTeamArray = collection
    .find(dbTriageChannelFilter, {projection: {teamInternalTriageChannelId: 1}})
    .toArray();

  return userTeamArray;
}

exports.findValidTriageChannel = findValidTriageChannel;
