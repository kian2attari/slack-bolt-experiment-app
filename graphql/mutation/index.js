const {removeLabels} = require('./removeLabels');

module.exports = {
  addLabelToIssue: require('./addLabelToIssue'),
  addCardToColumn: require('./addCardToColumn'),
  clearAllLabels: require('./clearAllLabels'),
  assignIssueToProject: require('./assignIssueToProject'),
  linkRepoToOrgLevelProject: require('./linkRepoToOrgLevelProject'),
  removeLabels,
};
