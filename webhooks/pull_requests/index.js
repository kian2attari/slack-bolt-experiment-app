const {
  pullRequestLabeled,
  pullRequestUnlabeled,
} = require('./pullRequestLabeledUnlabeled');
const {pullRequestOpened} = require('./pullRequestOpened');
const {pullRequestAssigned} = require('./pullRequestAssigned');
const {pullRequestReviewRequested} = require('./pullRequestReviewRequested');

exports.pullRequestLabeled = pullRequestLabeled;
exports.pullRequestUnlabeled = pullRequestUnlabeled;
exports.pullRequestOpened = pullRequestOpened;
exports.pullRequestAssigned = pullRequestAssigned;
exports.pullRequestReviewRequested = pullRequestReviewRequested;
