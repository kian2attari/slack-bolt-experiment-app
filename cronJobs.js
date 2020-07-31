const {CronJob} = require('cron');
const {send_mention_message} = require('./helper-functions');

// TODO remove passing this app parameter, there must be a way of avoiding this.
function check_review_requests(app) {
  return async () => {
    const {TriageTeamData} = require('./models');
    const pending_review_requests = await TriageTeamData.get_pending_review_requests();

    pending_review_requests.forEach(team => {
      // Each installation ID represents a seperate triage team/github org.
      console.log('installation id', team.gitwave_github_app_installation_id);
      team.pending_review_requests.forEach(review_request => {
        console.log('review request timestamp', review_request.request_timestamp);
        const {request_timestamp} = review_request;
        const days_since = Math.round((Date.now() - request_timestamp) / 86400000); // we divide by the number of ms in a day to see how many days have passed
        const minutes = Math.round((Date.now() - request_timestamp) / 60000);
        console.log('days since', days_since);
        console.log('minutes since', minutes);
        if (days_since === 1 || days_since === 3) {
          console.log('content create date', review_request.content_create_date);
          send_mention_message(app, review_request);
        }
      });
    });
  };
}

// Everyday, check the pending PR review requests of every team, and message the user the review was requested of after 1 day, and after 3 days
// TODO change the cron_pattern to '0 10,17 * * *' so that the job is run everyday at 10am and 5pm or just '0 10 * * *' for 10 am
const review_request_cron_job = app =>
  new CronJob('* * * * *', check_review_requests(app), null, true, 'America/Los_Angeles');

exports.review_request_cron_job = review_request_cron_job;
