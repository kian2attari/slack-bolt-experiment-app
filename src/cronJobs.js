const {CronJob} = require('cron');
const {sendMentionMessage, nextWeek, dateFormatter} = require('./helper-functions');
const {
  getPendingReviewRequests,
  getTeamTriageDutyAssignments,
  setTriageDutyAssignments,
} = require('./models');

// TODO remove passing this app parameter, there must be a way of avoiding this.
function checkReviewRequests(app) {
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
    const pendingReviewRequestsByTeam = await getPendingReviewRequests();

    console.log('pendingReviewRequestsByTeam', pendingReviewRequestsByTeam);
    /* REVIEW to make this more scalable, this function can also be modified so that the promises are resolved in batches rather than all at once. 
    For example, the Promises.all(...) can be placed in the outer reduce so that each team's batch of promises is done through each loop. In that case,
    it would make more sense to use the async_array_map helper function rather than reduce for the outside since we wouldn't be returning anything */
    const promiseArray = pendingReviewRequestsByTeam.reduce((reviewRequests, team) => {
      console.log('team', team.pendingReviewRequests);
      const reviewRequestPromises = team.pendingReviewRequests.reduce(
        (requestPromises, reviewRequest) => {
          console.log('review request timestamp', reviewRequest.requestTimestamp);
          const {requestTimestamp} = reviewRequest;
          const daysSince = Math.round((Date.now() - requestTimestamp) / 86400000); // we divide by the number of ms in a day to see how many days have passed
          // const minutes_since = Math.round((Date.now() - request_timestamp) / 60000);
          console.log('days since', daysSince);
          // console.log('minutes since', minutes_since);
          if (daysSince >= 1 && daysSince <= 4) {
            // TODO Check user preferences for when they want their first and second reminder to be. If it's within range, only then send the reminder.
            console.log('sending a reminder to:', reviewRequest.mentionedSlackUser);
            return requestPromises.concat(sendMentionMessage(app, reviewRequest));
          }
          return requestPromises;
        },
        []
      );
      return reviewRequests.concat(reviewRequestPromises);
    }, []);

    await Promise.all(promiseArray);
  };
}

function rotateTriageDutyAssignment(app) {
  return async () => {
    const teamData = await getTeamTriageDutyAssignments();

    const {triageDutyAssignments, teamChannelId, teamMembers} = teamData[0];

    const teamMemberAlphabeticArray = Object.keys(teamMembers).sort();

    // Get the current latest assignment in the array
    const {
      assignedTeamMember: lastAssignedMember,
      date: lastAssignmentDate,
    } = triageDutyAssignments[triageDutyAssignments.length - 1];

    const lastAssignedMemberIndex = teamMemberAlphabeticArray.indexOf(lastAssignedMember);

    const indexOfNewLastAssignedMember =
      lastAssignedMemberIndex === teamMemberAlphabeticArray.length - 1
        ? 0 // We've hit the end of the rotation so we start at the beginning
        : lastAssignedMemberIndex + 1;

    const newLastAssignedMember = teamMemberAlphabeticArray[indexOfNewLastAssignedMember];

    const newTriageAssignmentDateObj = nextWeek(new Date(lastAssignmentDate));

    const newTriageAssignmentDate = dateFormatter(newTriageAssignmentDateObj);

    // Remove the current week for the assignments since its already passed
    triageDutyAssignments.shift();

    // Remove the user that we just assigned to the furthest week from the list of possible substitutes for that week
    teamMemberAlphabeticArray.splice(indexOfNewLastAssignedMember, 1);

    triageDutyAssignments.push({
      'date': newTriageAssignmentDateObj.getTime(),
      'assignedTeamMember': newLastAssignedMember,
      'substitutes': teamMemberAlphabeticArray,
    });

    try {
      await setTriageDutyAssignments(teamChannelId, triageDutyAssignments);
      await Promise.all([
        app.client.conversations.setTopic({
          token: process.env.SLACK_BOT_TOKEN,
          channel: teamChannelId,
          topic: `<@${triageDutyAssignments[0].assignedTeamMember}> is on triage duty for the week of ${newTriageAssignmentDate}!`,
        }),
        app.client.chat.postMessage({
          // Since there is no context we just use the original token
          token: process.env.SLACK_BOT_TOKEN,
          channel: newLastAssignedMember,
          // Just in case there is an issue loading the blocks.
          // EXTRA_TODO add blocks that also display a button that opens up the Edit Triage availability Modal
          text: `Hey <@${newLastAssignedMember}>, you are up for triage duty assignment on *${newTriageAssignmentDate}*. \n If you are not available then, make sure to indicate that using the \`Triage Duty Availability\` Shortcut!`,
        }),
      ]);
    } catch (error) {
      console.error(error);
    }
  };
}

// Everyday, check the pending PR review requests of every team, and message the user the review was requested of after 1 day, and after 3 days
// TODO have this cron job run every week day and only send reminders to users who wanted them on that day in particular
// REVIEW change the cron_pattern to '0 10,15 * * *' so that the job is run everyday at 10am and 3pm or just '0 10 * * *' for 10 am etc
function reviewRequestCronJob(app) {
  return new CronJob(
    '0 10,17 * * *',
    checkReviewRequests(app),
    null,
    true,
    'America/Los_Angeles'
  );
}

function triageDutyRotation(app) {
  return new CronJob(
    '0 9 * * 1', // At 9am every Monday
    rotateTriageDutyAssignment(app),
    null,
    true,
    'America/Los_Angeles'
  );
}

exports.reviewRequestCronJob = reviewRequestCronJob;
exports.triageDutyRotation = triageDutyRotation;
