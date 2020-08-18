const {graphql, query} = require('../graphql');
const {AppHome, Modals} = require('../blocks');

const {SafeAccess} = require('../helper-functions');
const {updateDocument, findTriageTeamBySlackUser} = require('../db');
const {getCardsByColumn} = require('../models');
const {regExp} = require('../constants');

/**
 * Updates the app home page with a list of cards of untriaged issues/PR's depending on the
 * main level scope that was selected (ie. All Untriaged, only internal issues, only
 * external issues, or a specific repo).
 *
 * @param {any} contextDataObj The context and client from the action (ie. button press) or
 *     event (ie. app_home_opened) that would call this function
 * @returns {Promise}
 */
async function showUntriagedCards(contextDataObj) {
  const {context, client, selectedMainLevelView} = contextDataObj;

  // Grab the user id depending on whether the thing that called the function as an event or an action
  const userId =
    SafeAccess(() => contextDataObj.event.user) ||
    SafeAccess(() => contextDataObj.body.user.id);

  const teamData = await findTriageTeamBySlackUser(userId, {
    gitwaveGithubAppInstallationId: 1,
    orgLevelProjectBoard: 1,
    internalTriageItems: 1,
  });

  const {
    internalTriageItems,
    gitwaveGithubAppInstallationId: installationId,
    orgLevelProjectBoard: {projectId: orgProjectId},
  } = teamData[0];

  const triggerId = SafeAccess(() => contextDataObj.body.triggerId);

  /* A default project hasn't been set, open the modal. This is only if the trigger ID exists 
     was given because that indicated it was the result of an action not an event */
  if (typeof orgProjectId === 'undefined' && triggerId !== null) {
    console.log("A default untriaged project hasn't been set, opening the setup modal");
    return client.views.open({
      token: context.botToken,
      'trigger_id': triggerId,
      view: Modals.CreateTriageTeamModal,
    });
  }

  if (!orgProjectId) {
    console.log('No subscribed repos or some other issue occurred with the repo');
    // TODO open a modal showing this error
    throw Error('No subscribed repos or some other issue occurred with the repo');
  }

  // Show all untriaged issues from all repos
  const githubUntriagedCardsResponse = await graphql.callGhGraphql(
    query.getAllUntriaged,
    {projectIds: [orgProjectId]},
    installationId
  );

  const internalIssueCardArray = Object.values(internalTriageItems).filter(
    issues => typeof issues.issueTriageData === 'undefined'
  );

  console.log('internalIssueCardArray', internalIssueCardArray);

  const externalIssueCardArray = githubUntriagedCardsResponse.nodes[0].pendingCards.nodes;

  const untriagedBlocks = AppHome.AppHomeIssueCards.untriagedCards({
    externalIssueCardArray,
    internalIssueCardArray,
  });

  const homeView = AppHome.BaseAppHome(selectedMainLevelView, untriagedBlocks);

  return client.views.publish({
    token: context.botToken,
    'user_id': userId,
    view: homeView,
  });
}
/**
 * @param {{body: {}; client: {}; context: {}}} contextDataObj
 * @param {String} selectedButton
 * @param {Function} internalIssuesFilterCallbackGenerator Takes in a user_id and returns a
 *     callback function
 * @param {Function} externalCardFilterCallbackGenerator Takes a github_username and returns
 *     a callback function
 * @param {String} projectBoardColumn
 * @param {Boolean} showOnlyDone
 * @returns {Promise}
 */
async function showTriagedCards(
  contextDataObj,
  selectedButton,
  internalIssuesFilterCallbackGenerator,
  externalCardFilterCallbackGenerator,
  projectBoardColumn,
  showOnlyClaimedInternalIssues = false,
  showOnlyDone = false,
  assignedToSlackUserId = ''
) {
  const {body, client, context} = contextDataObj;

  const userId = body.user.id;

  /* Grab the org level project board for the triage team that the user is a part of. 
We only need the project board data so a projection is passed in as the second parameter */

  const response = await findTriageTeamBySlackUser(userId, {
    orgLevelProjectBoard: 1,
    gitwaveGithubAppInstallationId: 1,
    teamMembers: 1,
    internalTriageItems: 1,
  });

  const selectedColumn =
    response[0].orgLevelProjectBoard.projectColumns[projectBoardColumn];

  const installationId = response[0].gitwaveGithubAppInstallationId;

  const userGithubUsername =
    response[0].teamMembers[userId].githubUserData.githubUsername;

  const cardsResponse = await getCardsByColumn(selectedColumn.id, installationId);

  // We only want the cards that are assigned to this particular user so we gotta thin the stack out a bit

  const filteredExternalCards = cardsResponse.filter(
    externalCardFilterCallbackGenerator(userGithubUsername)
  );

  const filteredInternalIssues = internalIssuesFilterCallbackGenerator // In case a generator wasn't provided
    ? Object.values(response[0].internalTriageItems).filter(
        internalIssuesFilterCallbackGenerator(userId)
      )
    : [];

  const assignableTeamMembersArray = await assignableTeamMembers(userId);

  const cardBlocks = AppHome.AppHomeIssueCards.triagedCards(
    assignableTeamMembersArray,
    filteredExternalCards,
    filteredInternalIssues,
    showOnlyClaimedInternalIssues,
    showOnlyDone,
    assignedToSlackUserId
  );

  const homeView = AppHome.BaseAppHome('All', cardBlocks, selectedButton);

  return client.views.publish({
    token: context.botToken,
    'user_id': userId,
    view: homeView,
  });
}

/**
 * Updates the triage status of an internal issue. Used whenever a team member reacts to an
 * internal issue message, whether from the App Home or directly on the message.
 *
 * @param {{}} eventMetadata
 * @returns {Promise}
 */
async function updateInternalTriageStatusInDb(eventMetadata) {
  console.log('eventMetadata', eventMetadata);
  const {user, reaction, eventTs, channel, issueMessageTs} = eventMetadata;

  const issueTriageData = {
    actingTeamMemberUserId: user,
    reactionLastUpdateTs: eventTs,
    status: 'untriaged',
  };

  switch (reaction) {
    case 'eyes':
      issueTriageData.status = 'seen';
      break;
    case 'white_check_mark':
      issueTriageData.status = 'done';
      break;
    // no default
  }

  console.log('issueTriageData', issueTriageData);

  const teamQueryFilter = {
    teamInternalTriageChannelId: channel,
  };

  const fixedFormatTs = issueMessageTs.replace(regExp.findAllDots, '_');

  const updateIssueObj = {};

  const updateIssueObjProperty = `internalTriageItems.${fixedFormatTs}.issueTriageData`;

  updateIssueObj[updateIssueObjProperty] = issueTriageData;

  console.log('update issue obj', updateIssueObj);

  return updateDocument(teamQueryFilter, updateIssueObj);
}

async function assignableTeamMembers(userId) {
  const {teamMembers} = (
    await findTriageTeamBySlackUser(userId, {
      teamMembers: 1,
    })
  )[0];
  /* Note: I use the <@user_id> mention convention here so that the client will automatically 
    convert the slack user IDs. Since this is being done in a select menu and not in a message, 
    none of the users are actually mentioned! This method also has the added advantage of automatically
    highlighting the name of the user who clicked on the select menu. The alternative to this method
    would be calling the users.identity method on Slack API for every user and getting their names that way. 
    Ideally if you go this route, modify the DB model so that the user's display name is stored there. */

  const assignableUserArray = Object.keys(teamMembers).reduce(
    (assignableUsers, slackUserId) => {
      if (teamMembers[slackUserId].githubUserData.githubUsername !== null)
        assignableUsers.push(`<@${slackUserId}>`);
      return assignableUsers;
    },
    []
  );

  return assignableUserArray;
}

exports.updateInternalTriageStatusInDb = updateInternalTriageStatusInDb;
exports.showUntriagedCards = showUntriagedCards;
exports.showTriagedCards = showTriagedCards;
exports.assignableTeamMembers = assignableTeamMembers;
