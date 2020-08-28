const {issueOpenedReopened} = require('./issueOpenedReopened');
const {issueLabeled, issueUnlabeled} = require('./issueLabeledUnlabeled');
const {issueAssigned} = require('./issueAssigned');

exports.issueLabeled = issueLabeled;
exports.issueOpenedReopened = issueOpenedReopened;
exports.issueUnlabeled = issueUnlabeled;
exports.issueAssigned = issueAssigned;
