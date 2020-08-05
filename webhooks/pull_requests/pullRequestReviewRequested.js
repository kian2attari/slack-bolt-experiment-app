const {get_user_id_by_github_username, add_review_request} = require('../../models');
const {async_array_map, send_mention_message} = require('../../helper-functions');

async function pull_request_review_requested(app, req, res) {
  const request = req.body;
  const {
    // repository: {full_name: repo_path},
    sender: {login: requestor_login},
    pull_request,
    installation: {id: installation_id},
  } = request;

  const {
    requested_reviewers,
    title,
    body,
    html_url,
    user: pull_request_creator,
    created_at,
  } = pull_request;

  const content_create_date = new Date(created_at);

  const requested_reviewer_callback = async requested_reviewer => {
    const github_username = requested_reviewer.login;

    const mentioned_slack_user = await get_user_id_by_github_username(
      github_username,
      installation_id
    );

    // Message the team members whose review was requested
    const mention_event_data = {
      title,
      body,
      requestor_login,
      html_url,
      content_creator: pull_request_creator.login,
      avatar_url: pull_request_creator.avatar_url,
      content_create_date,
      mentioned_slack_user: `@${mentioned_slack_user}`,
      review_requested: true,
      installation_id,
    };

    console.log('mentioned slack user 1 ', mentioned_slack_user);

    if (mentioned_slack_user) {
      try {
        await add_review_request(mention_event_data, installation_id);

        await send_mention_message(app, mention_event_data);
      } catch (error) {
        console.error(error);
      }
    }

    res.send();
  };

  await async_array_map(requested_reviewers, requested_reviewer_callback);
}

exports.pull_request_review_requested = pull_request_review_requested;
