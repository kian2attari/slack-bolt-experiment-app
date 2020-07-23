const {check_for_mentions} = require('../../helper-functions');
const {mutation, graphql} = require('../../graphql');

function issue_opened_reopened(triage_team_data_obj, app, req, res) {
  console.log(`${req.headers['x-github-event']}.${req.body.action} arrived!`);
  const request = req.body;
  // eslint-disable-next-line no-unused-vars
  const {full_name: repo_path, id: repo_id} = request.repository;
  // TODO Use destructuring here
  const issue_url = request.issue.html_url;
  const issue_title = request.issue.title;
  const issue_body = request.issue.body;
  const issue_creator = request.issue.user.login;
  const creator_avatar_url = request.issue.user.avatar_url;
  const issue_create_date = new Date(request.issue.created_at);
  const issue_node_id = request.issue.node_id;

  const repo_obj = triage_team_data_obj.get_team_repo_subscriptions(repo_path);
  console.log(': ------------------');
  console.log('repo_obj', repo_obj);
  console.log(': ------------------');

  if (typeof repo_obj === 'undefined') {
    console.log(`${repo_path}: Team is not currently subscribed to this repo!`);
    res.send();
    return;
  }

  // QUESTION: Should editing the issue also cause the untriaged label to be added?

  const untriaged_label_id = repo_obj.untriaged_settings.untriaged_label.label_id;
  const variables_addLabelToIssue = {
    element_node_id: issue_node_id,
    label_ids: [untriaged_label_id],
  };

  // eslint-disable-next-line no-unused-vars
  const addLabelMutation = graphql
    .call_gh_graphql(mutation.addLabelToIssue, variables_addLabelToIssue, {
      repo_owner: repo_obj.repo_owner,
      repo_name: repo_obj.repo_name,
    })
    .then(addLabelMutation_response => {
      console.log('addLabelMutation_response', addLabelMutation_response);
      return addLabelMutation_response;
    })
    .catch(error => console.error(error));

  console.log(': ----------------------------------');
  console.log('addLabelMutation', addLabelMutation);
  console.log(': ----------------------------------');

  const mention_event_data = {
    channel_id: triage_team_data_obj.team_channel_id,
    title: issue_title,
    text_body: issue_body,
    content_url: issue_url,
    content_creator: issue_creator,
    creator_avatar_url,
    content_create_date: issue_create_date,
  };

  // TODO: instead of channel id, send over the users_triage_team object or don't and do it in the function
  check_for_mentions(app, mention_event_data, triage_team_data_obj);

  // Success
  res.send();
}

exports.issue_opened_reopened = issue_opened_reopened;
