const issue_actions = require('./issues');
const issue_comment_actions = require('./issue_comments');
const {
  new_gitwave_installation,
} = require('./new_gitwave_installation/newInstallationEvent');

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

  github_event.on('issues.opened', (req, res) =>
    issue_actions.issue_opened_reopened(triage_team_data_obj, app, req, res)
  );
  github_event.on('issues.labeled', (req, res) =>
    issue_actions.issue_labeled(triage_team_data_obj, app, req, res)
  );
  github_event.on('issues.unlabeled', (req, res) =>
    issue_actions.issue_unlabeled(triage_team_data_obj, app, req, res)
  );
  github_event.on('issue_comment.created', (req, res) =>
    issue_comment_actions.issue_comment_created(triage_team_data_obj, app, req, res)
  );
};
