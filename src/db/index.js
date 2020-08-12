const {connectToMongoCollection} = require('./dbConnection');
const {addNewInternalIssue} = require('./addNewInternalIssue');
const {findTriageTeamBySlackUser} = require('./findTriageTeamBySlackUser');
const {addNewTeamMembers} = require('./addNewTeamMembers');
const {addNewDocument} = require('./addNewDocument');
const {findDocuments} = require('./findDocuments');
const {findValidTriageChannel} = require('./findValidTriageChannel');
const {updateDocument} = require('./updateDocument');

exports.connectToMongoCollection = connectToMongoCollection;
exports.addNewInternalIssue = addNewInternalIssue;
exports.findTriageTeamBySlackUser = findTriageTeamBySlackUser;
exports.addNewTeamMembers = addNewTeamMembers;
exports.addNewDocument = addNewDocument;
exports.findDocuments = findDocuments;
exports.updateDocument = updateDocument;
exports.findValidTriageChannel = findValidTriageChannel;
