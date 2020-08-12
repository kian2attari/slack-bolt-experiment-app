const {query, graphql, mutation} = require('../graphql');
const {
  add_new_team_members,
  update_document,
  find_triage_team_by_slack_user,
  find_documents,
} = require('../db');
const {regExp} = require('../constants');

/* This is where all the DB operations are abstracted to. The goal is to avoid directly using the mongodb client methods throughout the 
code (ex. update, find, set etc) and instead abstract the functionalities here (ex. assign label to issue -- which will do all the mongodb calls under the hood) */

// TODO create a shortcut/modal that uses this. Currently, there's no way to add new members to a team besides rewriting the old team entirely
/**
 * Add new team members to a team
 *
 * @param {[String]} slack_user_ids
 * @param {String} triage_team_channel
 * @returns {Promise}
 */
async function add_team_members(slack_user_ids, triage_team_channel) {
  return add_new_team_members(slack_user_ids, triage_team_channel);
}

/**
 * Fetches the cards of a column given its Node ID
 *
 * @param {String} column_id
 * @returns {[Cards]}
 */
async function get_cards_by_column(column_id, installation_id) {
  const column_data_response = await graphql.call_gh_graphql(query.getCardsByProjColumn, {
    column_id,
    installation_id,
  });
  return column_data_response.node.cards.nodes;
}
/**
 * Link a team with an installation instance of GitWave. Installation ID's are always on an
 * org/user level, even if the app is only installed on a single repo. Each installation ID
 * can only be associated with one team and vice versa.
 *
 * @param {[String]} slack_user_ids
 * @param {String} team_channel_id
 * @param {String} team_internal_triage_channel_id
 * @param {{}} selected_github_org
 * @returns {Promise}
 */
async function associate_team_with_installation(
  slack_user_ids,
  team_channel_id,
  team_internal_triage_channel_id,
  selected_github_org
) {
  const team_member_obj = slack_user_ids.reduce((accumulator, currentValue) => {
    accumulator[currentValue] = {github_username: null, user_settings: {}};
    return accumulator;
  }, {});

  const sorted_slack_user_ids = slack_user_ids.sort();

  const team_size = sorted_slack_user_ids.length;

  const current_date = new Date();

  // Since the triage duty assignment cycle starts on monday, here we figure out the date of the Monday for this week. 0 = Sunday, so 1 = Monday
  const days_from_monday = 1 - current_date.getDay();

  const current_week_monday_date = new Date(
    current_date.getFullYear(),
    current_date.getMonth(),
    current_date.getDate() + days_from_monday
  );

  console.log('current_week_monday_date', current_week_monday_date);

  console.log('sorted_slack_user_ids', sorted_slack_user_ids);

  // Here we make triage assignments for the current week and next 3 weeks
  const triage_duty_assignments = [];

  // Every iteration is another week with i = 0 being the current week.
  for (let i = 0; i < 4; i += 1) {
    const assignedTeamMember = sorted_slack_user_ids[i % team_size]; // So we don't go out of range on our team member array

    triage_duty_assignments[i] = {
      date: current_week_monday_date.getTime() + i * 604800000, // 604800000 is the number of milliseconds in a week
      assignedTeamMember,
      substitutes: sorted_slack_user_ids.filter(
        slack_user_id => slack_user_id !== assignedTeamMember
      ),
    };
  }

  const filter = {'org_account.node_id': selected_github_org.value};

  const new_obj = {
    team_channel_id,
    team_internal_triage_channel_id,
    internal_triage_items: {},
    team_members: team_member_obj,
    pending_review_requests: [],
    triage_duty_assignments,
  };
  return update_document(filter, new_obj);
}
/**
 * Set a team's org-level project board. This board is synced up with all the repo-level
 * boards to provide an umbrella view of triage status across all of a team's repos.
 *
 * @param {any} project_obj
 * @param {String} installation_id
 * @returns {Promise}
 */
async function set_org_level_project(project_obj, installation_id) {
  const org_proj_data_response = await graphql.call_gh_graphql(
    query.getOrgProjectBasicData,
    {org_proj_id: project_obj.project_id},
    installation_id
  );

  const project_columns = org_proj_data_response.node.columns.nodes;

  const project_columns_obj = project_columns.reduce(
    (obj, column) => ({...obj, [column.name]: column}),
    {}
  );

  console.log(': -----------------------------------------------------------------');
  console.log('set_org_level_project -> project_columns_map', project_columns_obj);
  console.log(': -----------------------------------------------------------------');

  const project_obj_with_columns = {...project_obj, project_columns: project_columns_obj};

  const filter = {'gitwave_github_app_installation_id': installation_id};

  const new_obj = {
    org_level_project_board: project_obj_with_columns,
  };

  return update_document(filter, new_obj);
}
/**
 * Set a team member's GitHub username and store the mapping in the DB. A team member must
 * provide their GitHub usernames in order to receive mention notifications on Slack and so
 * they can be assigned to issues/PR's right from Slack.
 *
 * @param {String} slack_user_id
 * @param {String} github_username
 * @returns {Promise}
 */
async function set_user_github_username(slack_user_id, github_username) {
  // RegExp for checking the username
  const github_username_checker = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

  const valid_github_username = github_username_checker.test(github_username);

  console.log(': --------------------------------------------');
  console.log('valid_github_username', valid_github_username);
  console.log(': --------------------------------------------');

  if (!valid_github_username) {
    console.error('Invalid GH username');
    throw Error('invalid_github_username');
  }

  const username_update_obj = {};

  username_update_obj[`team_members.${slack_user_id}.github_username`] = github_username;

  const db_user_filter = {};

  db_user_filter[`team_members.${slack_user_id}`] = {$exists: true};

  return update_document(db_user_filter, username_update_obj);
}

// EXTRA_TODO modify the function so that it filters by installation ID. That way, a user can be part of multiple teams.
/**
 * Get a team member's GitHub username by their Slack user ID
 *
 * @param {String} slack_user_id
 * @returns {String} The team member's GitHub Username
 */
async function get_github_username_by_user_id(slack_user_id) {
  // First we check to see if the user has already mapped a github username
  const triage_team_members_response = await find_triage_team_by_slack_user(
    slack_user_id,
    {team_members: 1}
  );

  const slack_id_to_gh_username_match =
    triage_team_members_response[0].team_members[slack_user_id].github_username;

  console.log(': ------------------------------------------------------------');
  console.log(
    '1 slack_id_to_gh_username_match.team_members',
    slack_id_to_gh_username_match
  );
  console.log(': ------------------------------------------------------------');
  return slack_id_to_gh_username_match;
}

/**
 * Gets a team member's Slack user ID given their GitHub username. This function is mostly
 * useful for determining whether an @mention of a username on GitHub is a username that
 * belongs to a team member.
 *
 * @param {String} github_username
 * @param {String} installation_id
 * @returns {String} The team member's user ID
 */
async function get_user_id_by_github_username(github_username, installation_id) {
  // First we check to see if the user has already mapped a github username
  const triage_team_members_response = await find_documents(
    {
      gitwave_github_app_installation_id: installation_id,
    },
    {team_members: 1}
  );

  const {team_members} = triage_team_members_response[0];

  console.log('team_members', team_members);

  const gh_username_to_slack_id_match = Object.keys(team_members).find(
    key => team_members[key].github_username === github_username
  );

  console.log(': ------------------------------------------------------------');
  console.log(
    '1 get_user_id_by_github_username.team_members',
    gh_username_to_slack_id_match
  );
  console.log(': ------------------------------------------------------------');
  return gh_username_to_slack_id_match;
}
/**
 * Add labels to a card on GitHub. The label is actually applied to the element on the card
 * (ex. the issue or PR)
 *
 * @param {String} slack_user_id
 * @param {{issue_id: String; label_id: String}} graphql_variables The variables needed to
 *     make the GraphQL call
 * @returns {Promise}
 */
async function add_labels_to_card(slack_user_id, graphql_variables) {
  const {issue_id, label_id} = graphql_variables;
  const db_user_filter = {};

  db_user_filter[`team_members.${slack_user_id}`] = {$exists: true};

  const db_query = await find_documents(db_user_filter, {
    gitwave_github_app_installation_id: 1,
  });

  const installation_id = db_query[0].gitwave_github_app_installation_id;

  const variables_clearAllLabels = {
    element_node_id: issue_id,
  };

  await graphql.call_gh_graphql(
    mutation.clearAllLabels,
    variables_clearAllLabels,
    installation_id
  );

  const variables_addLabelToIssue = {
    element_node_id: issue_id,
    label_ids: [label_id],
  };

  return graphql.call_gh_graphql(
    mutation.addLabelToIssue,
    variables_addLabelToIssue,
    installation_id
  );

  /* TODO if the label was assigned successfully, update the app home view so that either the issue card is removed 
      from the page or the triage button that was clicked turns green */
}
/**
 * Get a repo's Untriaged label ID
 *
 * @param {String} repo_node_id
 * @param {String} installation_id
 * @returns {String} The Untriaged label ID
 */
async function get_repo_untriaged_label(repo_node_id, installation_id) {
  const getIdLabel_vars = {
    label_name: 'Untriaged',
    repo_id: repo_node_id,
  };

  const untriaged_label_response = await graphql.call_gh_graphql(
    query.getIdLabel,
    getIdLabel_vars,
    installation_id
  );
  return untriaged_label_response.node.label.id;
}
/**
 * Get the (discussion) channel ID of the triage team that's associated with a particular
 * Installation ID
 *
 * @param {String} installation_id
 * @returns {String} The team channel ID
 */
async function get_team_channel_id(installation_id) {
  const team_discussion_channel_id = await find_documents(
    {
      gitwave_github_app_installation_id: installation_id,
    },
    {team_channel_id: 1}
  );

  return team_discussion_channel_id[0].team_channel_id;
}
/**
 * Get the org-level project board of the team associated with a particular Installation ID
 *
 * @param {String} installation_id
 * @returns {{project_name: String; project_id: String; project_columns: {}}} The Project
 *     board
 */
async function get_team_org_level_project_board(installation_id) {
  const org_level_project_board_response = await find_documents(
    {
      gitwave_github_app_installation_id: installation_id,
    },
    {org_level_project_board: 1}
  );

  return org_level_project_board_response[0].org_level_project_board;
}
/**
 * @param {[{name: String; id: String; description: String}]} labels
 * @param {String} element_node_id
 * @param {String} repo_node_id
 * @param {String} installation_id
 * @returns {Promise}
 */
async function mark_element_as_untriaged(
  labels,
  element_node_id,
  repo_node_id,
  installation_id
) {
  const triage_label_count = labels.filter(label =>
    regExp.find_triage_labels(label.description)
  ).length;

  // TODO turn this into its own function
  // This means that the PR does not currently have any of the triage labels! We need to mark it as untriaged
  if (triage_label_count === 1) {
    console.log('The PR has already been triaged properly!');
    throw Error('The PR has already been triaged properly!');
  }

  // An element cannot have more than one label. If that's the case, we remove all labels and mark it as untriaged.
  // REVIEW would it be better to avoid clearing and just message the team?
  if (triage_label_count > 1) {
    const variables_clearAllLabels = {
      element_node_id: repo_node_id,
    };

    // clear the current labels first
    await graphql.call_gh_graphql(
      mutation.clearAllLabels,
      variables_clearAllLabels,
      installation_id
    );
  }

  const untriaged_label_id = await get_repo_untriaged_label(
    repo_node_id,
    installation_id
  );
  const variables_addLabelToIssue = {
    element_node_id,
    label_ids: [untriaged_label_id],
  };

  // eslint-disable-next-line no-unused-vars

  return graphql.call_gh_graphql(
    mutation.addLabelToIssue,
    variables_addLabelToIssue,
    installation_id
  );
}
/**
 * Add a new review request to the team's list of pending review requests in the DB
 *
 * @param {{}} review_request
 * @param {String} installation_id
 * @returns {Promise<UpdateWriteOpResult>}
 */
async function add_review_request(review_request, installation_id) {
  // To figure out the number of days since the review request, subtract the request_timestamp from the current timestamp and divide by 86400000
  const current_timestamp_in_ms = Date.now();
  const review_request_obj = {
    pending_review_requests: {
      ...review_request,
      request_timestamp: current_timestamp_in_ms,
    },
  };

  return update_document(
    {gitwave_github_app_installation_id: installation_id},
    review_request_obj,
    '$push'
  );
}
/**
 * Get all pending review requests for all teams. Provide an installation ID to grab the
 * pending review requests for a particular team.
 *
 * @param {String} [installation_id] Default is `null`
 * @returns {[{}]} The array of pending review requests.
 */
async function get_pending_review_requests(installation_id = null) {
  const filter = installation_id
    ? {gitwave_github_app_installation_id: installation_id}
    : {};
  const find_review_requests_response = await find_documents(filter, {
    gitwave_github_app_installation_id: 1,
    pending_review_requests: 1,
  });

  return find_review_requests_response;
}
/**
 * Get the repos that a particular user's triage team is subscribed to.
 *
 * @param {String} user_id
 * @returns {{subscribed_repos: {}; gitwave_github_app_installation_id: String}}
 */
async function get_team_repo_subscriptions(user_id) {
  const response = await find_triage_team_by_slack_user(user_id, {
    subscribed_repos: 1,
    gitwave_github_app_installation_id: 1,
  });

  return response[0];
}
/**
 * Returns the team members, triage duty assignments, and team channel ID's of every team or
 * just that of a specified user.
 *
 * @param {String} slack_user_id
 * @returns {{
 *   team_members: [String];
 *   triage_duty_assignments: {};
 *   team_channel_id: String;
 * }}
 */
async function get_team_triage_duty_assignments(slack_user_id = null) {
  const db_query =
    slack_user_id === null
      ? find_documents(
          {},
          {
            triage_duty_assignments: 1,
            team_channel_id: 1,
            team_members: 1,
          }
        )
      : find_triage_team_by_slack_user(slack_user_id, {
          triage_duty_assignments: 1,
          team_channel_id: 1,
          team_members: 1,
        });
  const team_data = await db_query;

  console.log('team data', team_data);

  return team_data;
}

async function set_triage_duty_assignments(
  team_channel_id,
  set_triage_duty_assignments_obj
) {
  return update_document(
    {team_channel_id},
    {triage_duty_assignments: set_triage_duty_assignments_obj}
  );
}

exports.TriageTeamData = {
  add_team_members,
  get_cards_by_column,
  associate_team_with_installation,
  set_user_github_username,
  set_org_level_project,
  get_github_username_by_user_id,
  get_team_repo_subscriptions,
  get_pending_review_requests,
  add_review_request,
  get_repo_untriaged_label,
  mark_element_as_untriaged,
  get_team_org_level_project_board,
  get_team_channel_id,
  get_user_id_by_github_username,
  add_labels_to_card,
  get_team_triage_duty_assignments,
  set_triage_duty_assignments,
};
