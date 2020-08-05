const {
  pull_request_labeled,
  pull_request_unlabeled,
} = require('./pullRequestLabeledUnlabeled');
const {pull_request_opened} = require('./pullRequestOpened');
const {pull_request_assigned} = require('./pullRequestAssigned');
const {pull_request_review_requested} = require('./pullRequestReviewRequested');

exports.pull_request_labeled = pull_request_labeled;
exports.pull_request_unlabeled = pull_request_unlabeled;
exports.pull_request_opened = pull_request_opened;
exports.pull_request_assigned = pull_request_assigned;
exports.pull_request_review_requested = pull_request_review_requested;
