const issueActions = require('./issues');
const issueCommentActions = require('./issue-comments');
const pullRequestActions = require('./pull-requests');
// const pull_request_review_actions = require('./pull_request_reviews');
const {newGitwaveInstallation} = require('./newInstallationEvent');

const {GitHubWebhookListener} = require('./GitHubWebhookListener');

exports.githubEvent = (router, app) => {
  const githubEvent = new GitHubWebhookListener(router);
  // The GitHub app was installed on a repo
  githubEvent.on('installation.created', (req, res) => {
    newGitwaveInstallation(req, res);
  });

  // TODO Remove info from DB when the app is uninstalled
  // github_event.on('installation.deleted', (req, res) => {
  // });

  // TODO Add new repo to that particular installation's document in the DB
  // github_event.on('installation_repositories.added', (req, res) => {
  //   new_gitwave_installation(req, res);
  // });

  // TODO Remove repo from that particular installation's document in the DB
  // github_event.on('installation_repositories.removed', (req, res) => {
  //   new_gitwave_installation(req, res);
  // });

  githubEvent.on('issues.opened', (req, res) =>
    issueActions.issueOpenedReopened(req, res, app)
  );
  githubEvent.on('issues.labeled', (req, res) => issueActions.issueLabeled(req, res));
  githubEvent.on('issues.unlabeled', (req, res) => issueActions.issueUnlabeled(req, res));
  githubEvent.on('issue_comment.created', (req, res) =>
    issueCommentActions.issueCommentCreated(req, res, app)
  );

  githubEvent.on('pull_request.opened', (req, res) =>
    pullRequestActions.pullRequestOpened(req, res, app)
  );

  // TODO all the commented listeners

  // github_event.on('pull_request.assigned', (req, res) =>
  //   pull_request_actions.pull_request_assigned(req, res, app)
  // );

  githubEvent.on('pull_request.review_requested', (req, res) =>
    pullRequestActions.pullRequestReviewRequested(req, res, app)
  );

  // github_event.on('pull_request.labeled', (req, res) =>
  //   pull_request_actions.pull_request_labeled(req, res, app)
  // );

  // github_event.on('pull_request.unlabeled', (req, res) =>
  //   pull_request_actions.pull_request_unlabeled(req, res, app)
  // );

  // github_event.on('pull_request_review.submitted', (req, res) =>
  //   pull_request_review_actions.pull_request_review_submitted(req, res, app)
  // );

  // github_event.on('pull_request.review_request_removed', (req, res) =>
  //   pull_request_actions.pull_request_review_request_removed(req, res, app)
  // );

  // github_event.on('label.created', (req, res) =>
  //   labelActions.labelCreated(req, res, app)
  // );

  // github_event.on('label.edited', (req, res) =>
  //   labelActions.labelEdited(req, res, app)
  // );

  // github_event.on('label.deleted', (req, res) =>
  //   labelActions.labelDeleted(req, res, app)
  // );
};
