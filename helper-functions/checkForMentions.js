const send_mention_message = require('./sendMentionMessage');
// Function that checks for github username mentions in a body of text
module.exports = (app, mention_metadata, triage_team_data_obj) => {
  /* Since the regex contains a global operator, matchAll can used to get all the matches & the groups as an iterable.
    In this first version, we don't need to use substring(1) to drop the @ since contains_mention would also have just the usernames. */
  const {
    channel_id,
    title,
    text_body,
    content_url,
    content_creator,
    creator_avatar_url,
    content_create_date,
  } = mention_metadata;

  const contains_mention = text_body.match(/\B@([a-z0-9](?:-?[a-z0-9]){0,38})/gi);

  // Checks to see if the body mentions a username
  if (contains_mention) {
    contains_mention.forEach(mentioned_username => {
      const github_username = mentioned_username.substring(1);

      console.log(`mentioned gh username: ${github_username}`);

      const mentioned_slack_user = triage_team_data_obj.get_team_member_by_github_username(
        github_username
      ).slack_user_id;
      console.log(': --------------------------------------------------------------');
      console.log('contains_mention -> mentioned_slack_user', mentioned_slack_user);
      console.log(': --------------------------------------------------------------');

      // If the mentioned username is associated with a Slack username, mention that person
      const mention_event_data = {
        channel_id,
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
        send_mention_message(app, mention_event_data);
      }
    });
  }
};
