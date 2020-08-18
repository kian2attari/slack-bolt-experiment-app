const {issueLabeled} = require('./issueLabeled');
const {issueOpenedReopened} = require('./issueOpenedReopened');
const {issueUnlabeled} = require('./issueUnlabeled');
const {issueAssigned} = require('./issueAssigned');

exports.issueLabeled = issueLabeled;
exports.issueOpenedReopened = issueOpenedReopened;
exports.issueUnlabeled = issueUnlabeled;
exports.issueAssigned = issueAssigned;
