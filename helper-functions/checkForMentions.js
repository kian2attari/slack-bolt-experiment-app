const send_mention_message = require('./sendMentionMessage');
const {reg_exp} = require('../constants');
const {async_array_map} = require('./asyncArrayMap');

// Function that checks for github username mentions in a body of text
async function check_for_mentions(app, mention_metadata) {
  /* Since the regex contains a global operator, matchAll can used to get all the matches & the groups as an iterable.
    In this first version, we don't need to use substring(1) to drop the @ since contains_mention would also have just the usernames. */
  const {
    title,
    body,
    html_url,
    content_creator,
    creator_avatar_url,
    content_create_date,
    installation_id,
  } = mention_metadata;

  const contains_mention = body.match(reg_exp.find_mentions);

  // Checks to see if the body mentions a username
  if (!contains_mention) {
    console.log('no mentions found!');
    return;
  }

  const mention_callback = async mentioned_username => {
    // TriageTeamData is imported within this function scope because it would otherwise conflict with the require in the webhooks
    // TODO fix this
    const {TriageTeamData} = require('../models');
    const github_username = mentioned_username.substring(1);

    console.log(`mentioned gh username: ${github_username}`);

    const mentioned_slack_user = await TriageTeamData.get_user_id_by_github_username(
      github_username,
      installation_id
    );

    console.log(': --------------------------------------------------------------');
    console.log('contains_mention -> mentioned_slack_user', mentioned_slack_user);
    console.log(': --------------------------------------------------------------');

    // If the mentioned username is associated with a Slack username, mention that person
    const mention_event_data = {
      title,
      body,
      html_url,
      creator: content_creator,
      avatar_url: creator_avatar_url,
      content_create_date,
      mentioned_slack_user: `@${mentioned_slack_user}`,
      is_closed: false,
      installation_id,
    };

    if (mentioned_slack_user) {
      await send_mention_message(app, mention_event_data);
    }
  };

  await async_array_map(contains_mention, mention_callback);
}

exports.check_for_mentions = check_for_mentions;
