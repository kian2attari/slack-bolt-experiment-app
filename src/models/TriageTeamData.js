const {query, graphql, mutation} = require('../graphql');
const {
  addNewTeamMembers,
  updateDocument,
  findTriageTeamBySlackUser,
  findDocuments,
} = require('../db');
const {regExp} = require('../constants');
const {shuffleArray} = require('../helper-functions');

/* This is where all the DB operations are abstracted to. The goal is to avoid directly using the mongodb client methods throughout the 
code (ex. update, find, set etc) and instead abstract the functionalities here (ex. assign label to issue -- which will do all the mongodb calls under the hood) */

// TODO create a shortcut/modal that uses this. Currently, there's no way to add new members to a team besides rewriting the old team entirely
/**
 * Add new team members to a team
 *
 * @param {[String]} slackUserIds
 * @param {String} triageTeamChannel
 * @returns {Promise}
 */
async function addTeamMembers(slackUserIds, triageTeamChannel) {
  return addNewTeamMembers(slackUserIds, triageTeamChannel);
}

/**
 * Fetches the cards of a column given its Node ID
 *
 * @param {String} columnId
 * @returns {[Cards]}
 */
async function getCardsByColumn(columnId, installationId) {
  const columnDataResponse = await graphql.callGhGraphql(query.getCardsByProjColumn, {
    columnId,
    installationId,
  });
  return columnDataResponse.node.cards.nodes;
}
/**
 * Link a team with an installation instance of GitWave. Installation ID's are always on an
 * org/user level, even if the app is only installed on a single repo. Each installation ID
 * can only be associated with one team and vice versa.
 *
 * @param {[String]} slackUserIds
 * @param {String} teamChannelId
 * @param {String} teamInternalTriageChannelId
 * @param {{}} selectedGithubOrg
 * @returns {Promise}
 */
async function associateTeamWithInstallation(
  slackUserIds,
  teamChannelId,
  teamInternalTriageChannelId,
  selectedGithubOrg
) {
  const teamMemberObj = slackUserIds.reduce((accumulator, currentValue) => {
    accumulator[currentValue] = {
      githubUserData: {githubUsername: null},
      userSettings: {},
    };
    return accumulator;
  }, {});

  const sortedSlackUserIds = slackUserIds.sort();

  const teamSize = sortedSlackUserIds.length;

  const currentDate = new Date();

  // Since the triage duty assignment cycle starts on monday, here we figure out the date of the Monday for this week. 0 = Sunday, so 1 = Monday
  const daysFromMonday = 1 - currentDate.getDay();

  const currentWeekMondayDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate() + daysFromMonday
  );

  console.log('currentWeekMondayDate', currentWeekMondayDate);

  console.log('sortedSlackUserIds', sortedSlackUserIds);

  // Here we make triage assignments for the current week and next 3 weeks
  const triageDutyAssignments = [];

  // Every iteration is another week with i = 0 being the current week.
  for (let i = 0; i < 4; i += 1) {
    const assignedTeamMember = sortedSlackUserIds[i % teamSize]; // So we don't go out of range on our team member array

    triageDutyAssignments[i] = {
      date: currentWeekMondayDate.getTime() + i * 604800000, // 604800000 is the number of milliseconds in a week
      assignedTeamMember,
      substitutes: shuffleArray(
        sortedSlackUserIds.filter(slackUserId => slackUserId !== assignedTeamMember)
      ),
    };
  }

  const filter = {'orgAccount.nodeId': selectedGithubOrg.value};

  const newObj = {
    teamChannelId,
    teamInternalTriageChannelId,
    internalTriageItems: {},
    teamMembers: teamMemberObj,
    pendingReviewRequests: [],
    triageDutyAssignments,
  };
  return updateDocument(filter, newObj);
}
/**
 * Set a team's org-level project board. This board is synced up with all the repo-level
 * boards to provide an umbrella view of triage status across all of a team's repos.
 *
 * @param {any} projectObj
 * @param {String} installationId
 * @returns {Promise}
 */
async function setOrgLevelProject(projectObj, installationId) {
  const orgProjDataResponse = await graphql.callGhGraphql(
    query.getOrgProjectBasicData,
    {orgProjId: projectObj.projectId},
    installationId
  );

  const projectColumns = orgProjDataResponse.node.columns.nodes;

  const projectColumnsObj = projectColumns.reduce(
    (obj, column) => ({...obj, [column.name]: column}),
    {}
  );

  console.log(': -----------------------------------------------------------------');
  console.log('setOrgLevelProject -> projectColumnsMap', projectColumnsObj);
  console.log(': -----------------------------------------------------------------');

  const projectObjWithColumns = {...projectObj, projectColumns: projectColumnsObj};

  const filter = {'gitwaveGithubAppInstallationId': installationId};

  const newObj = {
    orgLevelProjectBoard: projectObjWithColumns,
  };

  return updateDocument(filter, newObj);
}
/**
 * Set a team member's GitHub username and store the mapping in the DB. A team member must
 * provide their GitHub usernames in order to receive mention notifications on Slack and so
 * they can be assigned to issues/PR's right from Slack.
 *
 * @param {String} slackUserId
 * @param {String} githubUsername
 * @returns {Promise}
 */
async function setUserGithubUsername(slackUserId, githubUsername) {
  const isValidGithubUsername = regExp.validGithubUsername.test(githubUsername);
  // A preliminary local check of the username just to make sure its possible GH username before querying the API
  if (!isValidGithubUsername) {
    console.error('Invalid GH username');
    throw Error(
      `Hey <@${slackUserId}>,  ${githubUsername} is not a valid GitHub username. Please double check your spelling. `
    );
  }
  // We find the installation ID of the installation that this user's team is associated with
  const dbQueryResponse = await findTriageTeamBySlackUser(slackUserId, {
    gitwaveGithubAppInstallationId: 1,
    orgAccount: 1,
  });

  const {gitwaveGithubAppInstallationId: installationId, orgAccount} = dbQueryResponse[0];

  const {user: usernameData, organization} = await graphql.callGhGraphql(
    query.getGithubUsernameData,
    {
      githubUsername,
      organizationName: orgAccount.login, // we want to check that the account specified is indeed a member of the organization that the team is associated with
    },
    installationId
  );

  console.log('username Data', usernameData);

  // if either the user doesn't exist or isn't a part of the expected organization
  if (usernameData === null || organization === null) {
    const errorMsg = `${usernameData.user} is not a member of the team's GitHub organization: ${usernameData.organization}`;
    console.error(errorMsg);
    throw Error(`Hey <@${slackUserId}>,  ${errorMsg}`);
  }

  const usernameUpdateObj = {};

  usernameUpdateObj[`teamMembers.${slackUserId}.githubUserData`] = {
    id: usernameData.id,
    githubUsername: usernameData.login,
    name: usernameData.name,
  };

  const dbUserFilter = {};

  dbUserFilter[`teamMembers.${slackUserId}`] = {$exists: true};

  return updateDocument(dbUserFilter, usernameUpdateObj);
}

// EXTRA_TODO modify the function so that it filters by installation ID. That way, a user can be part of multiple teams.
/**
 * Get a team member's GitHub username by their Slack user ID
 *
 * @param {String} slackUserId
 * @returns {String} The team member's GitHub Username
 */
async function getGithubUsernameByUserId(slackUserId) {
  // First we check to see if the user has already mapped a github username
  const triageTeamMembersResponse = await findTriageTeamBySlackUser(slackUserId, {
    teamMembers: 1,
  });

  // TODO SafeAccess
  const slackIdToGhUsernameMatch =
    triageTeamMembersResponse[0].teamMembers[slackUserId].githubUserData.githubUsername;

  return slackIdToGhUsernameMatch;
}

/**
 * Gets a team member's Slack user ID given their GitHub username. This function is mostly
 * useful for determining whether an @mention of a username on GitHub is a username that
 * belongs to a team member.
 *
 * @param {String} githubUsername
 * @param {String} installationId
 * @returns {String} The team member's user ID
 */
async function getUserIdByGithubUsername(githubUsername, installationId) {
  // First we check to see if the user has already mapped a github username
  const triageTeamMembersResponse = await findDocuments(
    {
      gitwaveGithubAppInstallationId: installationId,
    },
    {teamMembers: 1}
  );

  const {teamMembers} = triageTeamMembersResponse[0];

  console.log('teamMembers', teamMembers);

  const ghUsernameToSlackIdMatch = Object.keys(teamMembers).find(
    key => teamMembers[key].githubUserData.githubUsername === githubUsername
  );

  console.log(': ------------------------------------------------------------');
  console.log('1 getUserIdByGithubUsername.teamMembers', ghUsernameToSlackIdMatch);
  console.log(': ------------------------------------------------------------');
  return ghUsernameToSlackIdMatch;
}
/**
 * Add labels to a card on GitHub. The label is actually applied to the element on the card
 * (ex. the issue or PR)
 *
 * @param {String} slackUserId
 * @param {{issueId: String; labelId: String}} graphqlVariables The variables needed to make
 *     the GraphQL call
 * @returns {Promise}
 */
async function addLabelsToCard(slackUserId, graphqlVariables) {
  const {issueId, labelId} = graphqlVariables;
  const dbUserFilter = {};

  dbUserFilter[`teamMembers.${slackUserId}`] = {$exists: true};

  const dbQuery = await findDocuments(dbUserFilter, {
    gitwaveGithubAppInstallationId: 1,
  });

  const installationId = dbQuery[0].gitwaveGithubAppInstallationId;

  const variablesClearAllLabels = {
    elementNodeId: issueId,
  };

  await graphql.callGhGraphql(
    mutation.clearAllLabels,
    variablesClearAllLabels,
    installationId
  );

  const variablesAddLabelToIssue = {
    elementNodeId: issueId,
    labelIds: [labelId],
  };

  return graphql.callGhGraphql(
    mutation.addLabelToIssue,
    variablesAddLabelToIssue,
    installationId
  );

  /* TODO if the label was assigned successfully, update the app home view so that either the issue card is removed 
      from the page or the triage button that was clicked turns green */
}
/**
 * Get a repo's Untriaged label ID
 *
 * @param {String} repoNodeId
 * @param {String} installationId
 * @returns {String} The Untriaged label ID
 */
async function getRepoUntriagedLabel(repoNodeId, installationId) {
  const getIdLabelVars = {
    labelName: 'Untriaged',
    repoId: repoNodeId,
  };

  const untriagedLabelResponse = await graphql.callGhGraphql(
    query.getIdLabel,
    getIdLabelVars,
    installationId
  );
  return untriagedLabelResponse.node.label.id;
}
/**
 * Get the (discussion) channel ID of the triage team that's associated with a particular
 * Installation ID
 *
 * @param {String} installationId
 * @returns {String} The team channel ID
 */
async function getTeamChannelId(installationId) {
  const teamDiscussionChannelId = await findDocuments(
    {
      gitwaveGithubAppInstallationId: installationId,
    },
    {teamChannelId: 1}
  );

  return teamDiscussionChannelId[0].teamChannelId;
}
/**
 * Get the org-level project board of the team associated with a particular Installation ID
 *
 * @param {String} installationId
 * @returns {{projectName: String; projectId: String; projectColumns: {}}} The Project board
 */
async function getTeamOrgLevelProjectBoard(installationId) {
  const orgLevelProjectBoardResponse = await findDocuments(
    {
      gitwaveGithubAppInstallationId: installationId,
    },
    {orgLevelProjectBoard: 1}
  );

  return orgLevelProjectBoardResponse[0].orgLevelProjectBoard;
}
/**
 * @param {[{name: String; id: String; description: String}]} labels
 * @param {String} elementNodeId
 * @param {String} repoNodeId
 * @param {String} installationId
 * @returns {Promise}
 */
async function markElementAsUntriaged(labels, elementNodeId, repoNodeId, installationId) {
  const triageLabelCount = labels.filter(label =>
    regExp.findTriageLabels(label.description)
  ).length;

  // TODO turn this into its own function
  // This means that the PR does not currently have any of the triage labels! We need to mark it as untriaged
  if (triageLabelCount === 1) {
    console.log('The PR has already been triaged properly!');
    throw Error('The PR has already been triaged properly!');
  }

  // An element cannot have more than one label. If that's the case, we remove all labels and mark it as untriaged.
  // REVIEW would it be better to avoid clearing and just message the team?
  if (triageLabelCount > 1) {
    const variablesClearAllLabels = {
      elementNodeId: repoNodeId,
    };

    // clear the current labels first
    await graphql.callGhGraphql(
      mutation.clearAllLabels,
      variablesClearAllLabels,
      installationId
    );
  }

  const untriagedLabelId = await getRepoUntriagedLabel(repoNodeId, installationId);
  const variablesAddLabelToIssue = {
    elementNodeId,
    labelIds: [untriagedLabelId],
  };

  // eslint-disable-next-line no-unused-vars

  return graphql.callGhGraphql(
    mutation.addLabelToIssue,
    variablesAddLabelToIssue,
    installationId
  );
}
/**
 * Add a new review request to the team's list of pending review requests in the DB
 *
 * @param {{}} reviewRequest
 * @param {String} installationId
 * @returns {Promise<UpdateWriteOpResult>}
 */
async function addReviewRequest(reviewRequest, installationId) {
  // To figure out the number of days since the review request, subtract the requestTimestamp from the current timestamp and divide by 86400000
  const currentTimestampInMs = Date.now();
  const reviewRequestObj = {
    pendingReviewRequests: {
      ...reviewRequest,
      requestTimestamp: currentTimestampInMs,
    },
  };

  return updateDocument(
    {gitwaveGithubAppInstallationId: installationId},
    reviewRequestObj,
    '$push'
  );
}
/**
 * Get all pending review requests for all teams. Provide an installation ID to grab the
 * pending review requests for a particular team.
 *
 * @param {String} [installationId] Default is `null`
 * @returns {[{}]} The array of pending review requests.
 */
async function getPendingReviewRequests(installationId = null) {
  const filter = installationId ? {gitwaveGithubAppInstallationId: installationId} : {};
  const findReviewRequestsResponse = await findDocuments(filter, {
    gitwaveGithubAppInstallationId: 1,
    pendingReviewRequests: 1,
  });

  return findReviewRequestsResponse;
}
/**
 * Get the repos that a particular user's triage team is subscribed to.
 *
 * @param {String} slackUserId
 * @returns {{subscribedRepos: {}; gitwaveGithubAppInstallationId: String}}
 */
async function getTeamRepoSubscriptions(slackUserId) {
  const response = await findTriageTeamBySlackUser(slackUserId, {
    subscribedRepos: 1,
    gitwaveGithubAppInstallationId: 1,
  });

  return response[0];
}
/**
 * Returns the team members, triage duty assignments, and team channel ID's of every team or
 * just that of a specified user.
 *
 * @param {String} slackUserId
 * @returns {{
 *   teamMembers: [String];
 *   triageDutyAssignments: {};
 *   teamChannelId: String;
 * }}
 */
async function getTeamTriageDutyAssignments(slackUserId = null) {
  const dbQuery =
    slackUserId === null
      ? findDocuments(
          {},
          {
            triageDutyAssignments: 1,
            teamChannelId: 1,
            teamMembers: 1,
          }
        )
      : findTriageTeamBySlackUser(slackUserId, {
          triageDutyAssignments: 1,
          teamChannelId: 1,
          teamMembers: 1,
        });
  const teamData = await dbQuery;

  console.log('team data', teamData);

  return teamData;
}

async function setTriageDutyAssignments(teamChannelId, setTriageDutyAssignmentsObj) {
  return updateDocument(
    {teamChannelId},
    {triageDutyAssignments: setTriageDutyAssignmentsObj}
  );
}

async function assignTeamMemberToIssueOrPR(slackUserId, elementNodeId) {
  const userData = await findTriageTeamBySlackUser(slackUserId, {
    teamMembers: 1,
    gitwaveGithubAppInstallationId: 1,
  });

  const {teamMembers, gitwaveGithubAppInstallationId: installationId} = userData[0];

  return graphql.callGhGraphql(
    mutation.assignTeamMemberToIssueOrPR,
    {
      assignableId: elementNodeId,
      assigneeIds: [teamMembers[slackUserId].githubUserData.id],
    },
    installationId
  );
}

exports.TriageTeamData = {
  addTeamMembers,
  getCardsByColumn,
  associateTeamWithInstallation,
  setUserGithubUsername,
  setOrgLevelProject,
  getGithubUsernameByUserId,
  getTeamRepoSubscriptions,
  getPendingReviewRequests,
  addReviewRequest,
  getRepoUntriagedLabel,
  markElementAsUntriaged,
  getTeamOrgLevelProjectBoard,
  getTeamChannelId,
  getUserIdByGithubUsername,
  addLabelsToCard,
  getTeamTriageDutyAssignments,
  setTriageDutyAssignments,
  assignTeamMemberToIssueOrPR,
};
