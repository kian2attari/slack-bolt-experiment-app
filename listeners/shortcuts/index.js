const {edit_triage_duty_availability} = require('./editTriageDutyAvailability');

module.exports = {
  edit_triage_duty_availability,
  setup_triage_workflow: require('./setupTriageWorkflow'),
  modify_github_username: require('./modifyGithubUsername'),
};
