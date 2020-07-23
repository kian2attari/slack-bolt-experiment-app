const issue_actions = require('./issues');
const issue_comment_actions = require('./issue_comments');

const {GitHubWebhookListener} = require('./GitHubWebhookListener');

exports.github_event = (router, triage_team_data_obj, app) => {
  const github_event = new GitHubWebhookListener(router);

  // github_event.on('issues', test_arrived);
  // github_event.on('issue_comment', test_arrived);

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

// function test_arrived(req, res) {
//   console.log(`${req.headers['x-github-event']} arrived!`);
//   res.send('Webhook initial test was received');
// }
