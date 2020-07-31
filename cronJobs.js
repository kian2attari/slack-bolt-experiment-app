const {CronJob} = require('cron');

async function check_review_requests() {
  const {TriageTeamData} = require('./models');
  const pending_review_requests = await TriageTeamData.get_pending_review_requests();

  pending_review_requests.forEach(team => {
    console.log('installation id', team.gitwave_github_app_installation_id);
    team.pending_review_requests.forEach(request => {
      console.log('review request timestamp', request.request_timestamp);
    });
  });
}

// Everyday, check the list of
const review_request_cron_job = new CronJob(
  '* * * * *',
  check_review_requests,
  null,
  true,
  'America/Los_Angeles'
);

exports.review_request_cron_job = review_request_cron_job;
