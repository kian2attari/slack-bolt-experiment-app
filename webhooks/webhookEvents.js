const issue_actions = require('./issues');
const issue_comment_actions = require('./issue_comments');
const pull_request_actions = require('./pull_requests');
// const pull_request_review_actions = require('./pull_request_reviews');
const {new_gitwave_installation} = require('./newInstallationEvent');

const {GitHubWebhookListener} = require('./GitHubWebhookListener');

exports.github_event = (router, triage_team_data_obj, app) => {
  const github_event = new GitHubWebhookListener(router);
  // The GitHub app was installed on a repo
  github_event.on('installation.created', (req, res) => {
    new_gitwave_installation(req, res);
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

  github_event.on('issues.opened', (req, res) =>
    issue_actions.issue_opened_reopened(app, req, res)
  );
  github_event.on('issues.labeled', (req, res) => issue_actions.issue_labeled(req, res));
  github_event.on('issues.unlabeled', (req, res) =>
    issue_actions.issue_unlabeled(req, res)
  );
  github_event.on('issue_comment.created', (req, res) =>
    issue_comment_actions.issue_comment_created(app, req, res)
  );

  github_event.on('issue_comment.created', (req, res) =>
    issue_comment_actions.issue_comment_created(app, req, res)
  );

  github_event.on('pull_request.opened', (req, res) =>
    pull_request_actions.pull_request_opened(app, req, res)
  );

  // TODO all the commented stuff

  // github_event.on('pull_request.assigned', (req, res) =>
  //   pull_request_actions.pull_request_assigned(app, req, res)
  // );

  // github_event.on('pull_request.review_requested', (req, res) =>
  //   pull_request_actions.pull_request_review_requested(app, req, res)
  // );

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
