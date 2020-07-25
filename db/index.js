const {test_connect} = require('./testConnectToDB');
const {add_new_internal_issue} = require('./addNewInternalIssue');
const {add_new_triage_team_to_db} = require('./addNewTriageTeam');
const {update_issue_triage_status} = require('./updateIssueTriageStatus');

exports.test_connect = test_connect;
exports.add_new_internal_issue = add_new_internal_issue;
exports.add_new_triage_team_to_db = add_new_triage_team_to_db;
exports.update_issue_triage_status = update_issue_triage_status;
