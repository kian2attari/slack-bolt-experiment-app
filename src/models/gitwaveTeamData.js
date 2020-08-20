const {query, graphql, mutation} = require('../graphql');
const {
  addNewTeamMembers,
  updateDocument,
  findTriageTeamBySlackUser,
  findDocuments,
} = require('../db');
const {regExp} = require('../constants');
const {
  gitwaveUserData: {updateUserObj},
} = require('./gitwaveUserData');
const {
  shuffleArray,
  setChannelTopicAndNotifyLatestAssignee,
} = require('../helper-functions');

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
 * @param {String} installationId
 * @returns {[Cards]}
 */
async function getCardsByColumn(columnId, installationId) {
  const columnDataResponse = await graphql.callGhGraphql(
    query.getCardsByProjColumn,
    {
      columnIds: [columnId],
    },
    installationId
  );
  return columnDataResponse.nodes[0].cards.nodes;
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
  app,
  slackUserIds,
  teamChannelId,
  teamInternalTriageChannelId,
  selectedGithubOrg
) {
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

  // Up to how many weeks in advance you want GitWave to generate assignments for
  const weeksInAdvance = 3;

  // Every iteration is another week with i = 0 being the current week.
  for (let i = 0; i <= weeksInAdvance; i += 1) {
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

  const triageDutyAssignmentsObj = {
    teamChannelId,
    teamInternalTriageChannelId,
    internalTriageItems: {},
    teamMembers: slackUserIds,
    pendingReviewRequests: [],
    triageDutyAssignments,
  };
  try {
    const updateDocResponse = await updateDocument(filter, triageDutyAssignmentsObj);
    await setChannelTopicAndNotifyLatestAssignee(
      app,
      teamChannelId,
      triageDutyAssignments[0],
      triageDutyAssignments[triageDutyAssignments.length - 1]
    );
    return updateDocResponse;
  } catch (error) {
    console.error(error);
    throw error;
  }
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
      `Hey <@${slackUserId}>,  *${githubUsername}* is not a valid GitHub username. Please double check your spelling. `
    );
  }
  // We find the installation ID of the installation that this user's team is associated with
  const dbQueryResponse = await findTriageTeamBySlackUser(slackUserId, {
    gitwaveGithubAppInstallationId: 1,
    orgAccount: 1,
  });

  const {gitwaveGithubAppInstallationId: installationId} = dbQueryResponse[0];

  const userData = await graphql.callGhGraphql(
    query.getGithubUsernameData,
    {
      githubUsername,
    },
    installationId
  );

  console.log('userData ', userData);

  const usernameData = userData.user;

  const usernameUpdateObj = {
    githubUserId: usernameData.id,
    githubUsername: usernameData.login,
    name: usernameData.name,
  };

  await updateUserObj(slackUserId, usernameUpdateObj);
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
async function getUserIdByGithubUsername(githubUsername) {
  const ghUsernameToSlackIdMatch = await findDocuments(
    {githubUsername},
    {slackUserId: 1, githubUsername: 1},
    'gitwave_user_data'
  );

  console.log(': ------------------------------------------------------------');
  console.log('1 getUserIdByGithubUsername.teamMembers', ghUsernameToSlackIdMatch);
  console.log(': ------------------------------------------------------------');
  return ghUsernameToSlackIdMatch[0].slackUserId;
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
  const dbUserFilter = {teamMembers: slackUserId};

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
    labelName: 'untriaged',
    repoId: repoNodeId,
  };

  const untriagedLabelResponse = await graphql.callGhGraphql(
    query.getIdLabel,
    getIdLabelVars,
    installationId
  );

  console.log('untriagedLabelResponse', untriagedLabelResponse);

  if (untriagedLabelResponse.node.label === null) {
    console.log(
      'No untriaged label found. Remember, label names are case sensitive. The label should be "untriaged"'
    );
    throw Error(
      'No untriaged label found. Remember, label names are case sensitive. The label should be "untriaged"'
    );
  }
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
 * Get the org-level and repo-level project boards of the team associated with a particular
 * Installation ID
 *
 * @param {String} installationId
 * @param {String} repoFullName The full name of the repo in owner/repo-name format
 * @returns {{projectName: String; projectId: String; projectColumns: {}}} The Project board
 */
async function getTeamOrgAndRepoLevelProjectBoards(repoFullName, installationId) {
  const queryProjection = {orgLevelProjectBoard: 1};
  // We only want the data of the specified repo's project board
  queryProjection[`subscribedRepos.${repoFullName}`] = 1;

  const projectBoardsResponse = await findDocuments(
    {
      gitwaveGithubAppInstallationId: installationId,
    },
    queryProjection
  );

  return {
    orgLevelProjectBoard: projectBoardsResponse[0].orgLevelProjectBoard,
    repoLevelProjectBoard:
      projectBoardsResponse[0].subscribedRepos[repoFullName].repoLevelProject,
  };
}
/**
 * Marks a PR/Issue on GitHub as Untriaged
 *
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
 * teamMembers: [String];
 * triageDutyAssignments: {[
 * {
 * date: String;
 * assignedTeamMember: String;
 * substitutes: [String];
 * }
 * ]};
 * teamChannelId: String;
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

  return teamData;
}

/**
 * Updates the DB with new triage assignments
 *
 * @param {any} teamChannelId
 * @param {any} setTriageDutyAssignmentsArray
 * @param {bool} [currentWeekAssignmentChange] Default is `false`
 * @param {string} [slackUserId] Default is `''`
 * @returns {any}
 */
async function setTriageDutyAssignments(
  teamChannelId,
  setTriageDutyAssignmentsArray,
  app = undefined,
  currentWeekAssignmentChange = false,
  slackUserId = ''
) {
  let triageTeamChannelId = teamChannelId;
  console.log('teamChannelId 1', triageTeamChannelId);
  if (triageTeamChannelId === null) {
    triageTeamChannelId = (
      await findTriageTeamBySlackUser(slackUserId, {
        teamChannelId: 1,
      })
    )[0].teamChannelId;
  }
  console.log('teamChannelId 2', triageTeamChannelId);
  await updateDocument(
    {teamChannelId: triageTeamChannelId},
    {triageDutyAssignments: setTriageDutyAssignmentsArray}
  );

  // If this week's assignment changes, update the triage team channel topic and message the newly-assigned
  if (currentWeekAssignmentChange) {
    await setChannelTopicAndNotifyLatestAssignee(
      app,
      triageTeamChannelId,
      setTriageDutyAssignmentsArray[0]
    );
  }
}
/**
 * Assign a team member to an Issue/PR on GitHub.
 *
 * @param {String} githubUserId The GitHub user ID of the team member
 * @param {String} elementNodeId The node ID of the Issue/PR
 * @returns {Promise} The promise response from the GraphQL mutation
 */
async function assignTeamMemberToIssueOrPR(slackUserId, elementNodeId, githubUserId) {
  const teamDataResponse = await findTriageTeamBySlackUser(slackUserId, {
    teamMembers: 1,
    gitwaveGithubAppInstallationId: 1,
  });

  // const teamMemberGithubUserIdsResponse = await gitwaveUserData.getGithubUserIdsFromSlackUserIds(
  //   teamDataResponse[0].teamMembers
  // );

  // const teamMemberGithubUserIds = teamMemberGithubUserIdsResponse.reduce(
  //   (githubUserIds, userObj) => {
  //     if (userObj.githubUserId) {
  //       githubUserIds.push(userObj.githubUserId);
  //     }
  //     return githubUserIds;
  //   },
  //   []
  // );

  console.log('teamMemberGithubUserIds', githubUserId);

  const installationId = teamDataResponse[0].gitwaveGithubAppInstallationId;

  const response = await graphql.callGhGraphql(
    mutation.assignTeamMemberToIssueOrPR,
    {
      assignableId: elementNodeId,
      assigneeIds: [githubUserId],
    },
    installationId
  );

  if (response.errorType) {
    throw Error(response.errorType);
  }
}

exports.gitwaveTeamData = {
  addTeamMembers,
  getCardsByColumn,
  associateTeamWithInstallation,
  setUserGithubUsername,
  setOrgLevelProject,
  getTeamRepoSubscriptions,
  getPendingReviewRequests,
  addReviewRequest,
  getRepoUntriagedLabel,
  markElementAsUntriaged,
  getTeamOrgAndRepoLevelProjectBoards,
  getTeamChannelId,
  getUserIdByGithubUsername,
  addLabelsToCard,
  getTeamTriageDutyAssignments,
  setTriageDutyAssignments,
  assignTeamMemberToIssueOrPR,
};
