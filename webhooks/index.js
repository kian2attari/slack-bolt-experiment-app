const {GitHubWebhookListener} = require('./GitHubWebhookListener');

exports.github_event = router => {
  const github_event = new GitHubWebhookListener(router);

  github_event.on('issues', test_arrived);
  github_event.on('issue_comment', test_arrived);
};

function test_arrived(req, res) {
  console.log(`${req.headers['x-github-event']} arrived!`);
  res.send('Webhook initial test was received');
}
