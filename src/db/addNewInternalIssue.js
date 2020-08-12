const {connectToMongoCollection} = require('./dbConnection');
const {regExp} = require('../constants');

/**
 * @param {{
 *   teamInternalTriageChannelId: String;
 *   internalTriageItem: {
 *     text: String;
 *     user: String;
 *     urgency: String;
 *     issueMessageTs: String;
 *   };
 * }} newIssueObj
 */
// eslint-disable-next-line consistent-return
async function addNewInternalIssue(newIssueMessageObj) {
  // Use connect method to connect to the Server
  try {
    const collection = await connectToMongoCollection();

    console.log('collection', collection);

    const teamQuery = {
      teamInternalTriageChannelId: newIssueMessageObj.teamInternalTriageChannelId,
    };

    // TODO if this query returns nothing, then send a message to the user with an error! The team hasn't set a traige channel

    console.log('team query', teamQuery);

    const {internalTriageItem} = newIssueMessageObj;
    // the dots in the ts will confuse mongo, they need to be replaced with dashes.
    const fixedFormatTs = internalTriageItem.issueMessageTs.replace(
      regExp.findAllDots,
      '_'
    );

    const newIssueObj = {};

    const newIssueObjProperty = `internalTriageItems.${fixedFormatTs}`;

    newIssueObj[newIssueObjProperty] = internalTriageItem;

    console.log('add new internal issue', newIssueObj);

    const pushNewValue = {
      $set: newIssueObj,
    };
    return collection.updateOne(teamQuery, pushNewValue);
    // Update a single document
  } catch (error) {
    console.error(error);
  }
}

exports.addNewInternalIssue = addNewInternalIssue;
