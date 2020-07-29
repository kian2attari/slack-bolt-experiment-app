const {test_connect} = require('./testConnectToDB');
const {add_new_internal_issue} = require('./addNewInternalIssue');
const {add_new_triage_team_to_db} = require('./addNewTriageTeam');
const {find_triage_team_by_slack_user} = require('./findTriageTeamBySlackUser');
const {add_new_team_members} = require('./addNewTeamMembers');
const {add_new_document} = require('./addNewDocument');
const {find_documents} = require('./findDocuments');
const {update_document} = require('./updateDocument');

exports.test_connect = test_connect;
exports.add_new_internal_issue = add_new_internal_issue;
exports.add_new_triage_team_to_db = add_new_triage_team_to_db;
exports.find_triage_team_by_slack_user = find_triage_team_by_slack_user;
exports.add_new_team_members = add_new_team_members;
exports.add_new_document = add_new_document;
exports.find_documents = find_documents;
exports.update_document = update_document;
