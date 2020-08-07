const {CronJob} = require('cron');
const {send_mention_message} = require('./helper-functions');
const {get_pending_review_requests, get_team_triage_assignments} = require('./models');

// TODO remove passing this app parameter, there must be a way of avoiding this.
function check_review_requests(app) {
  return async () => {
    /* This is an array of objects, with each object representing a separate team/installation. 
    Each team object then has an array of pending review requests. For each of those review requests,
    we check if they fall within the range where we would want to send a reminder (ex. 1 day or 3 days), 
    and if they do, the send_mention_message function is used to notify the user. Since 
    send_mention_message is an asynchronous function, it wouldn't make sense to do this process
    in a synchronous loop and get stuck every time a message needs to be sent. It would be better
    to go through each team object, gather up the needed message_sending promises in an array, and then
    use Promise.all() to fulfill all those promises concurrently. In promise_array, I use
    a nested reduce function to do just this. The inner reduce function creates arrays of promises for each team,
    while the outer reduce concatenates those arrays into one single array of promises to be passed into
    Promises.all(...). I use reduce rather than a map for the inner loop because we are returning conditionally
    (since only a set of the review requests actually need reminders sent), and map tries to apply the callback function
    to every element. To use map, we'd need to filter first, and that's just more work for nothing. */
    const pending_review_requests_by_team = await get_pending_review_requests();

    console.log('pending_review_requests_by_team', pending_review_requests_by_team);
    /* REVIEW to make this more scalable, this function can also be modified so that the promises are resolved in batches rather than all at once. 
    For example, the Promises.all(...) can be placed in the outer reduce so that each team's batch of promises is done through each loop. In that case,
    it would make more sense to use the async_array_map helper function rather than reduce for the outside since we wouldn't be returning anything */
    const promise_array = pending_review_requests_by_team.reduce(
      (review_requests, team) => {
        console.log('team', team.pending_review_requests);
        const review_request_promises = team.pending_review_requests.reduce(
          (request_promises, review_request) => {
            console.log('review request timestamp', review_request.request_timestamp);
            const {request_timestamp} = review_request;
            const days_since = Math.round((Date.now() - request_timestamp) / 86400000); // we divide by the number of ms in a day to see how many days have passed
            // const minutes_since = Math.round((Date.now() - request_timestamp) / 60000);
            console.log('days since', days_since);
            // console.log('minutes since', minutes_since);
            if (days_since >= 1 && days_since <= 4) {
              // TODO Check user preferences for when they want their first and second reminder to be. If it's within range, only then send the reminder.
              console.log('sending a reminder to:', review_request.mentioned_slack_user);
              return request_promises.concat(send_mention_message(app, review_request));
            }
            return request_promises;
          },
          []
        );
        return review_requests.concat(review_request_promises);
      },
      []
    );

    await Promise.all(promise_array);
  };
}

function rotate_triage_duty_assignment(app) {
  return async () => {
    const team_data = await get_team_triage_assignments();

    console.log(': -------------------------------------------------------------');
    console.log('function rotate_triage_duty_assignment -> team_data', team_data);
    console.log(': -------------------------------------------------------------');

    const {triage_duty_assignments, team_channel_id} = team_data;

    // TODO get all the triage teams and their members
    // TODO See which member is next on the block, and if they haven't marked themselves unavailable for that week, set the channel topic to them
  };
}

// Everyday, check the pending PR review requests of every team, and message the user the review was requested of after 1 day, and after 3 days
// REVIEW change the cron_pattern to '0 10,15 * * *' so that the job is run everyday at 10am and 3pm or just '0 10 * * *' for 10 am etc
// REVIEW Should I use const review_request_cron_job = app => or function syntax?
function review_request_cron_job(app) {
  return new CronJob(
    '0 10,17 * * *',
    check_review_requests(app),
    null,
    true,
    'America/Los_Angeles'
  );
}

function triage_duty_rotation(app) {
  return new CronJob(
    '0 9 * * 1', // At 9am every Monday
    rotate_triage_duty_assignment(app),
    null,
    true,
    'America/Los_Angeles'
  );
}

exports.review_request_cron_job = review_request_cron_job;
