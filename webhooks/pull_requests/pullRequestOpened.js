const {check_for_mentions} = require('../../helper-functions');
const {mutation, graphql} = require('../../graphql');
const {reg_exp} = require('../../constants');
const {TriageTeamData} = require('../../models');

async function pull_request_opened(app, req, res) {
  const request = req.body;
  const installation_id = request.installation.id;

  const {
    labels,
    node_id: issue_node_id,
    repository,
    title,
    body,
    html_url,
    user,
    created_at,
  } = request.pull_request;

  // TODO turn this into its own function
  // This means that the PR does not currently have any of the triage labels! We need to mark it as untriaged
  if (!labels.some(label => reg_exp.find_triage_labels(label.description))) {
    const repo_node_id = repository.node_id;
    const untriaged_label_id = await TriageTeamData.get_repo_untriaged_label(
      repo_node_id,
      installation_id
    );
    const variables_addLabelToIssue = {
      element_node_id: issue_node_id,
      label_ids: [untriaged_label_id],
    };

    // eslint-disable-next-line no-unused-vars

    try {
      await graphql.call_gh_graphql(
        mutation.addLabelToIssue,
        variables_addLabelToIssue,
        installation_id
      );
    } catch (error) {
      console.error(error);
    }
  }

  const mention_event_data = {
    title,
    text_body: body,
    content_url: html_url,
    content_creator: user.login,
    creator_avatar_url: user.avatar_url,
    content_create_date: created_at,
    installation_id,
  };

  // TODO: instead of channel id, send over the users_triage_team object or don't and do it in the function
  await check_for_mentions(app, mention_event_data);

  // TODO label opened PR with untriaged if none of the triage labels have been applied already
  // Success
  res.send();
}

exports.pull_request_opened = pull_request_opened;
