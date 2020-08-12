const {removeLabels} = require('./removeLabels');
const {moveProjectCard} = require('./moveProjectCardToColumn');

module.exports = {
  addLabelToIssue: require('./addLabelToIssue'),
  addCardToColumn: require('./addCardToColumn'),
  clearAllLabels: require('./clearAllLabels'),
  assignIssueToProject: require('./assignIssueToProject'),
  linkRepoToOrgLevelProject: require('./linkRepoToOrgLevelProject'),
  removeLabels,
  moveProjectCard,
};
