const {issue_labeled} = require('./issueLabeled');
const {issue_opened_reopened} = require('./issueOpenedReopened');
const {issue_unlabeled} = require('./issueUnlabeled');

exports.issue_labeled = issue_labeled;
exports.issue_opened_reopened = issue_opened_reopened;
exports.issue_unlabeled = issue_unlabeled;
