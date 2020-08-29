const {removeLabels} = require('./removeLabels');
const {moveProjectCard} = require('./moveProjectCardToColumn');
const {assignTeamMemberToIssueOrPR} = require('./assignTeamMemberToIssueOrPR');
const {assignPullRequestToProject} = require('./assignPullRequestToProject');

module.exports = {
  addLabelToIssue: require('./addLabelToIssue'),
  clearAllLabels: require('./clearAllLabels'),
  assignIssueToProject: require('./assignIssueToProject'),
  assignPullRequestToProject,
  linkRepoToOrgLevelProject: require('./linkRepoToOrgLevelProject'),
  removeLabels,
  moveProjectCard,
  assignTeamMemberToIssueOrPR,
};
