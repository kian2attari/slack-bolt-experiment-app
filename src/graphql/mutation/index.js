const {removeLabels} = require('./removeLabels');
const {moveProjectCard} = require('./moveProjectCardToColumn');
const {assignTeamMemberToIssueOrPR} = require('./assignTeamMemberToIssueOrPR');

module.exports = {
  addLabelToIssue: require('./addLabelToIssue'),
  addCardToColumn: require('./addCardToColumn'),
  clearAllLabels: require('./clearAllLabels'),
  assignIssueToProject: require('./assignIssueToProject'),
  linkRepoToOrgLevelProject: require('./linkRepoToOrgLevelProject'),
  removeLabels,
  moveProjectCard,
  assignTeamMemberToIssueOrPR,
};
