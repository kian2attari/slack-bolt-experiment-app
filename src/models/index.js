const {TriageTeamData} = require('./TriageTeamData');

const {
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
} = TriageTeamData;

exports.addTeamMembers = addTeamMembers;
exports.getCardsByColumn = getCardsByColumn;
exports.associateTeamWithInstallation = associateTeamWithInstallation;
exports.setUserGithubUsername = setUserGithubUsername;
exports.setOrgLevelProject = setOrgLevelProject;
exports.getGithubUsernameByUserId = getGithubUsernameByUserId;
exports.getTeamRepoSubscriptions = getTeamRepoSubscriptions;
exports.getPendingReviewRequests = getPendingReviewRequests;
exports.addReviewRequest = addReviewRequest;
exports.getRepoUntriagedLabel = getRepoUntriagedLabel;
exports.markElementAsUntriaged = markElementAsUntriaged;
exports.getTeamOrgLevelProjectBoard = getTeamOrgLevelProjectBoard;
exports.getTeamChannelId = getTeamChannelId;
exports.getUserIdByGithubUsername = getUserIdByGithubUsername;
exports.addLabelsToCard = addLabelsToCard;
exports.getTeamTriageDutyAssignments = getTeamTriageDutyAssignments;
exports.setTriageDutyAssignments = setTriageDutyAssignments;
exports.assignTeamMemberToIssueOrPR = assignTeamMemberToIssueOrPR;
