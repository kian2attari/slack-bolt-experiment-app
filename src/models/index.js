const {gitwaveTeamData} = require('./gitwaveTeamData');
const {gitwaveUserData} = require('./gitwaveUserData');

const {
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
} = gitwaveTeamData;

exports.addTeamMembers = addTeamMembers;
exports.getCardsByColumn = getCardsByColumn;
exports.associateTeamWithInstallation = associateTeamWithInstallation;
exports.setUserGithubUsername = setUserGithubUsername;
exports.setOrgLevelProject = setOrgLevelProject;
exports.getTeamRepoSubscriptions = getTeamRepoSubscriptions;
exports.getPendingReviewRequests = getPendingReviewRequests;
exports.addReviewRequest = addReviewRequest;
exports.getRepoUntriagedLabel = getRepoUntriagedLabel;
exports.markElementAsUntriaged = markElementAsUntriaged;
exports.getTeamOrgAndRepoLevelProjectBoards = getTeamOrgAndRepoLevelProjectBoards;
exports.getTeamChannelId = getTeamChannelId;
exports.getUserIdByGithubUsername = getUserIdByGithubUsername;
exports.addLabelsToCard = addLabelsToCard;
exports.getTeamTriageDutyAssignments = getTeamTriageDutyAssignments;
exports.setTriageDutyAssignments = setTriageDutyAssignments;
exports.assignTeamMemberToIssueOrPR = assignTeamMemberToIssueOrPR;
exports.gitwaveUserData = gitwaveUserData;
