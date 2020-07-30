const {check_for_mentions, send_mention_message} = require('../../helper-functions');

async function issue_comment_created(app, req, res) {
  // TODO refactor these constant declarations
  const request = req.body;

  const installation_id = request.installation.id;
  const issue_url = request.issue.html_url;
  const issue_title = request.issue.title;
  const comment_body = request.comment.body;
  const comment_creator = request.comment.user.login;
  const creator_avatar_url = request.comment.user.avatar_url;
  // FIXME date is undefined fix it
  const comment_create_date = new Date(request.comment.created_at);

  if (req.body.issue.state === 'closed') {
    const mention_event_data = {
      title: `Comment on closed issue: ${issue_title}`,
      body: comment_body,
      url: issue_url,
      creator: comment_creator,
      avatar_url: creator_avatar_url,
      create_date: comment_create_date,
      mentioned_slack_user: '!channel',
      is_issue_closed: true,
    };
    // TODO make a new function that sends a message to the team and adds the untriaged label to said issue
    await send_mention_message(app, mention_event_data);
  }

  const mention_event_data = {
    title: `New comment on issue: ${issue_title}`,
    text_body: comment_body,
    content_url: issue_url,
    content_creator: comment_creator,
    creator_avatar_url,
    content_create_date: comment_create_date,
    installation_id,
  };

  await check_for_mentions(app, mention_event_data);

  res.send();
}

exports.issue_comment_created = issue_comment_created;
