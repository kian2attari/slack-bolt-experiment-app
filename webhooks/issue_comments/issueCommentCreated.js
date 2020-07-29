const {check_for_mentions, send_mention_message} = require('../../helper-functions');

function issue_comment_created(triage_team_data_obj, app, req, res) {
  console.log(`${req.headers['x-github-event']} arrived!`);
  // TODO refactor these constant declarations
  const request = req.body;
  // eslint-disable-next-line no-unused-vars
  const {full_name: repo_path, id: repo_id} = request.repository;
  const issue_url = request.issue.html_url;
  const issue_title = request.issue.title;
  const comment_body = request.comment.body;
  const comment_creator = request.comment.user.login;
  const creator_avatar_url = request.comment.user.avatar_url;
  // FIXME date is undefined fix it
  const comment_create_date = new Date(request.comment.created_at);

  if (req.body.issue.state === 'closed') {
    const mention_event_data = {
      channel_id: triage_team_data_obj.team_discussion_channel_id,
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
    send_mention_message(app, mention_event_data);
  }

  const mention_event_data = {
    channel_id: triage_team_data_obj.team_discussion_channel_id,
    title: `New comment on issue: ${issue_title}`,
    text_body: comment_body,
    content_url: issue_url,
    content_creator: comment_creator,
    creator_avatar_url,
    content_create_date: comment_create_date,
  };

  check_for_mentions(app, mention_event_data, triage_team_data_obj);

  res.send();
}

exports.issue_comment_created = issue_comment_created;
