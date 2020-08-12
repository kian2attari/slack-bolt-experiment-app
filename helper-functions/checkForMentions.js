const sendMentionMessage = require('./sendMentionMessage');
const {regExp} = require('../constants');
const {asyncArrayMap} = require('./asyncArrayMap');

// Function that checks for github username mentions in a body of text
async function checkForMentions(app, mentionMetadata) {
  /* Since the regex contains a global operator, matchAll can used to get all the matches & the groups as an iterable.
    In this first version, we don't need to use substring(1) to drop the @ since containsMention would also have just the usernames. */
  const {
    title,
    body,
    htmlUrl,
    contentCreator,
    creatorAvatarUrl,
    contentCreateDate,
    installationId,
  } = mentionMetadata;

  const containsMention = body.match(regExp.findMentions);

  // Checks to see if the body mentions a username
  if (!containsMention) {
    console.log('no mentions found!');
    return;
  }

  const mentionCallback = async mentionedUsername => {
    /* FIXME Why does this require only work in this function scope but not if it were at the top of the file? Must be some node module cache conflict 
    since the functions in TriageTeamData are required from different scopes of the project (ex require('../models) require('../../models') etc). */
    const {getUserIdByGithubUsername} = require('../models');
    const githubUsername = mentionedUsername.substring(1);

    console.log(`mentioned gh username: ${githubUsername}`);

    const mentionedSlackUser = await getUserIdByGithubUsername(
      githubUsername,
      installationId
    );

    console.log(': --------------------------------------------------------------');
    console.log('containsMention -> mentionedSlackUser', mentionedSlackUser);
    console.log(': --------------------------------------------------------------');

    // If the mentioned username is associated with a Slack username, mention that person
    const mentionEventData = {
      title,
      body,
      htmlUrl,
      creator: contentCreator,
      avatarUrl: creatorAvatarUrl,
      contentCreateDate,
      mentionedSlackUser: `@${mentionedSlackUser}`,
      isClosed: false,
      installationId,
    };

    if (mentionedSlackUser) {
      await sendMentionMessage(app, mentionEventData);
    }
  };

  await asyncArrayMap(containsMention, mentionCallback);
}

exports.checkForMentions = checkForMentions;
