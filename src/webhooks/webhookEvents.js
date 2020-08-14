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
    issueActions.issueOpenedReopened(app, req, res)
  );
  githubEvent.on('issues.labeled', (req, res) => issueActions.issueLabeled(req, res));
  githubEvent.on('issues.unlabeled', (req, res) => issueActions.issueUnlabeled(req, res));
  githubEvent.on('issue_comment.created', (req, res) =>
    issueCommentActions.issueCommentCreated(app, req, res)
  );

  githubEvent.on('pull_request.opened', (req, res) =>
    pullRequestActions.pullRequestOpened(app, req, res)
  );

  // TODO all the commented stuff

  // github_event.on('pull_request.assigned', (req, res) =>
  //   pull_request_actions.pull_request_assigned(app, req, res)
  // );

  githubEvent.on('pull_request.review_requested', (req, res) =>
    pullRequestActions.pullRequestReviewRequested(app, req, res)
  );

  // github_event.on('pull_request.labeled', (req, res) =>
  //   pull_request_actions.pull_request_labeled(app, req, res)
  // );

  // github_event.on('pull_request.unlabeled', (req, res) =>
  //   pull_request_actions.pull_request_unlabeled(app, req, res)
  // );

  // github_event.on('pull_request_review.submitted', (req, res) =>
  //   pull_request_review_actions.pull_request_review_submitted(app, req, res)
  // );

  // github_event.on('pull_request.review_request_removed', (req, res) =>
  //   pull_request_actions.pull_request_review_request_removed(app, req, res)
  // );
};
