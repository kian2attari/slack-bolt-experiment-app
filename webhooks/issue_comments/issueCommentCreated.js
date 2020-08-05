const {check_for_mentions, send_mention_message} = require('../../helper-functions');

async function issue_comment_created(app, req, res) {
  // TODO refactor these constant declarations
  const request = req.body;

  const installation_id = request.installation.id;
  const {html_url, title, state} = request.issue;
  const {body} = request.comment;
  const comment_creator = request.comment.user.login;
  const creator_avatar_url = request.comment.user.avatar_url;
  const content_create_date = new Date(request.comment.created_at);

  if (state === 'closed') {
    const mention_event_data = {
      title: `Comment on closed issue: ${title}`,
      body,
      html_url,
      content_creator: comment_creator,
      avatar_url: creator_avatar_url,
      content_create_date,
      mentioned_slack_user: '!channel',
      is_closed: true,
      installation_id,
    };
    // TODO make a new function that sends a message to the team and adds the untriaged label to said issue
    await send_mention_message(app, mention_event_data);

    res.send();
  }

  const mention_event_data = {
    title: `New comment on issue: ${title}`,
    body,
    html_url,
    content_creator: comment_creator,
    creator_avatar_url,
    content_create_date,
    installation_id,
  };

  await check_for_mentions(app, mention_event_data);

  res.send();
}

exports.issue_comment_created = issue_comment_created;
