const {setOrgLevelProject} = require('../../models');
const {findDocuments} = require('../../db');

module.exports = app => {
  app.view('setup_org_project_modal', async ({ack, body, view, context}) => {
    // Acknowledge the view_submission event
    // TODO HIGH if the modal was closed/cancelled, then update the app home to say that GitWave needs an Org Level project board in order to work. Have a button that reopens this modal
    await ack();

    const user = body.user.id;

    const dbUserFilter = {teamMembers: user};

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
