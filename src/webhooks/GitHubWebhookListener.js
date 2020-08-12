const {EventEmitter} = require('events');

class GitHubWebhookListener extends EventEmitter {
  constructor(router) {
    super();
    router.post('/gh-webhook', (req, res) => {
      if (req.headers['content-type'] !== 'application/json') {
        res.send('Send webhook as application/json');
        return;
      }
      this.emit(req.headers['x-github-event'] + '.' + req.body.action, req, res); // eslint-disable-line prefer-template
      console.log(`${req.headers['x-github-event']}.${req.body.action} arrived!`);
    });
  }
}

exports.GitHubWebhookListener = GitHubWebhookListener;
