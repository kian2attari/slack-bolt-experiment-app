const {graphql, query} = require('../graphql');
const {AppHome} = require('../blocks');
const {Modals} = require('../blocks');
const {SafeAccess} = require('../helper-functions');
const {updateDocument, findTriageTeamBySlackUser} = require('../db');
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
    // team_internal_triage_channel_id: 1,
  });

  const {
    internalTriageItems,
    gitwaveGithubAppInstallationId: installationId,
    orgLevelProjectBoard: {projectId: repoProjectId},
  } = teamData[0];

  const triggerId = SafeAccess(() => contextDataObj.body.triggerId);

  /* A default project hasn't been set, open the modal. This is only if the trigger ID exists 
     was given because that indicated it was the result of an action not an event */
  if (typeof repoProjectId === 'undefined' && triggerId !== null) {
    console.log("A default untriaged project hasn't been set, opening the setup modal");
    return client.views.open({
      token: context.botToken,
      'trigger_id': triggerId,
      view: Modals.CreateTriageTeamModal,
    });
  }

  if (!repoProjectId) {
    console.log('No subscribed repos or some other issue occurred with the repo');
    // TODO open a modal showing this error
    throw Error('No subscribed repos or some other issue occurred with the repo');
  }

  // Show all untriaged issues from all repos
  const githubUntriagedCardsResponse = await graphql.callGhGraphql(
    query.getAllUntriaged,
    {projectIds: [repoProjectId]},
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
  showOnlyDone = false
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

  const getCardsByProjColumnVars = {
    columnId: selectedColumn.id,
  };

  const cardsResponse = await graphql.callGhGraphql(
    query.getCardsByProjColumn,
    getCardsByProjColumnVars,
    installationId
  );

  // We only want the cards that are assigned to this particular user so we gotta thin the stack out a bit

  const filteredExternalCards = cardsResponse.node.cards.nodes.filter(
    externalCardFilterCallbackGenerator(userGithubUsername)
  );

  console.log(': ------------------------------------------------------------------');
  console.log('filteredExternalCards', filteredExternalCards);
  console.log(': ------------------------------------------------------------------');

  const filteredInternalIssues = internalIssuesFilterCallbackGenerator // In case a generator wasn't provided
    ? Object.values(response[0].internalTriageItems).filter(
        internalIssuesFilterCallbackGenerator(userId)
      )
    : [];

  console.log(': ------------------------------------------------------------------');
  console.log('filteredInternalIssues', filteredInternalIssues);
  console.log(': ------------------------------------------------------------------');

  const cardBlocks = AppHome.AppHomeIssueCards.triagedCards(
    filteredExternalCards,
    filteredInternalIssues,
    showOnlyClaimedInternalIssues,
    showOnlyDone
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

exports.updateInternalTriageStatusInDb = updateInternalTriageStatusInDb;
exports.showUntriagedCards = showUntriagedCards;
exports.showTriagedCards = showTriagedCards;
