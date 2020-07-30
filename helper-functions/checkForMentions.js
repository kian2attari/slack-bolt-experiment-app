const send_mention_message = require('./sendMentionMessage');
const {reg_exp} = require('../constants');

// Function that checks for github username mentions in a body of text
async function check_for_mentions(app, mention_metadata) {
  // TriageTeamData is imported within this function scope because it would otherwise conflict with the require in the webhooks
  // TODO fix this
  const {TriageTeamData} = require('../models');
  /* Since the regex contains a global operator, matchAll can used to get all the matches & the groups as an iterable.
    In this first version, we don't need to use substring(1) to drop the @ since contains_mention would also have just the usernames. */
  const {
    title,
    text_body,
    content_url,
    content_creator,
    creator_avatar_url,
    content_create_date,
    installation_id,
  } = mention_metadata;

  const contains_mention = text_body.match(reg_exp.find_mentions);

  // Checks to see if the body mentions a username
  if (!contains_mention) {
    console.log('no mentions found!');
    return;
  }

  // Since using await in a loop is bad practice, this cobination of map + promise.all is a better way to avoid doing it sequentially
  await Promise.all(
    contains_mention.map(async mentioned_username => {
      const github_username = mentioned_username.substring(1);

      console.log(`mentioned gh username: ${github_username}`);

      const mentioned_slack_user = await TriageTeamData.get_user_id_by_github_username(
        github_username,
        installation_id
      );

      console.log(': --------------------------------------------------------------');
      console.log('contains_mention -> mentioned_slack_user', mentioned_slack_user);
      console.log(': --------------------------------------------------------------');
      const team_discussion_channel_id = await TriageTeamData.get_team_channel_id(
        installation_id
      );
      // If the mentioned username is associated with a Slack username, mention that person
      const mention_event_data = {
        team_discussion_channel_id,
        title,
        body: text_body,
        url: content_url,
        creator: content_creator,
        avatar_url: creator_avatar_url,
        create_date: content_create_date,
        mentioned_slack_user,
        is_issue_closed: false,
      };

      if (mentioned_slack_user) {
        await send_mention_message(app, mention_event_data);
      }
    })
  );
}

exports.check_for_mentions = check_for_mentions;
