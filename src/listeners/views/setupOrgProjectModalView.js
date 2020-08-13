const {setOrgLevelProject} = require('../../models');
const {findDocuments} = require('../../db');

module.exports = app => {
  app.view('setup_org_project_modal', async ({ack, body, view, context}) => {
    // Acknowledge the view_submission event
    await ack();

    const user = body.user.id;

    const dbUserFilter = {};

    dbUserFilter[`teamMembers.${user}`] = {$exists: true};

    const dbQuery = await findDocuments(dbUserFilter, {
      gitwaveGithubAppInstallationId: 1,
    });

    const installationId = dbQuery[0].gitwaveGithubAppInstallationId;

    const selectedOrgLevelProj =
      view.state.values.org_project_input_block.org_level_project_input.selected_option;

    // set default project name
    await setOrgLevelProject(
      {
        projectName: selectedOrgLevelProj.text.text,
        projectId: selectedOrgLevelProj.value,
      },
      installationId
    );

    // Success! Message the user
    try {
      await app.client.chat.postMessage({
        token: context.botToken,
        // TODO message the whole team not just the user who the project board
        channel: user,
        text: `Hi <@${user}>, the organization project board was set successfully!`,
      });
      // TODO Also refresh the app home page automatically here
    } catch (error) {
      console.error(error);
    }
  });
};
