const {SubBlocks} = require('../../blocks');
const {SafeAccess} = require('../../helper-functions');
const {query, graphql} = require('../../graphql');
const {findDocuments} = require('../../db');

/**
 * Gets a list of all the orgs/accounts that gitwave is installed on. This includes
 * repo-level installations.
 *
 * @param {any} app
 */
function githubOrgSelectInput(app) {
  // eslint-disable-next-line no-unused-vars
  app.options('github_org_select_input', async ({options, ack}) => {
    try {
      // The query paramater is empty since we want to return all installations
      const orgsResponseArray = await findDocuments({}, {orgAccount: 1});

      const orgsWithoutExistingTeamArray = orgsResponseArray.filter(
        org => typeof org.teamChannelId === 'undefined'
      );

      console.log(
        ': ---------------------------------------------------------------------------'
      );
      console.log(
        'function github_org_select_input -> orgsWithoutExistingTeamArray',
        orgsWithoutExistingTeamArray
      );
      console.log(
        ': ---------------------------------------------------------------------------'
      );

      if (orgsWithoutExistingTeamArray.size !== 0) {
        // Creates the options blocks out of the orgs
        const orgOptionsBlockList = orgsWithoutExistingTeamArray.map(org => {
          return SubBlocks.optionObj(org.orgAccount.login, org.orgAccount.nodeId);
        });

        console.log('orgOptionsBlockList', orgOptionsBlockList);

        await ack({
          options: orgOptionsBlockList,
        });
      } else {
        const noOrgsOption = SubBlocks.optionObj('No orgs found', 'no_orgs');
        // REVIEW should I return the empty option or nothing at all?

        await ack({
          options: noOrgsOption,
        });
      }
    } catch (error) {
      console.error(error);
    }
  });
}

function orgLevelProjectInput(app) {
  app.options('org_level_project_input', async ({options, ack}) => {
    try {
      const dbUserFilter = {};

      dbUserFilter[`teamMembers.${options.user.id}`] = {$exists: true};

      const dbQuery = await findDocuments(dbUserFilter, {
        gitwaveGithubAppInstallationId: 1,
      });

      console.log(': -----------------------------------------------------');
      console.log('function org_level_project_input -> db_query', dbQuery);
      console.log(': -----------------------------------------------------');

      const installationId = dbQuery[0].gitwaveGithubAppInstallationId;

      const orgOrUserId = JSON.parse(options.view.private_metadata).selectedOrgNodeId;

      console.log(': -----------------------------------------------------------------');
      console.log('function org_level_project_input -> org_or_user_id', orgOrUserId);
      console.log(': -----------------------------------------------------------------');

      const orgLevelProjectsResponse = await graphql.callGhGraphql(
        query.getOrgAndUserLevelProjects,
        {orgOrUserId},
        installationId
      );
      const orgLevelProjects = SafeAccess(
        () => orgLevelProjectsResponse.node.projects.nodes
      );

      if (orgLevelProjects.size !== 0) {
        const projectOptionsBlockList = Array.from(orgLevelProjects.values()).map(
          project => {
            return SubBlocks.optionObj(project.name, project.id);
          }
        );

        console.log('project_options_block_list', projectOptionsBlockList);

        await ack({
          options: projectOptionsBlockList,
        });
      } else {
        const noProjectsOption = SubBlocks.optionObj('No projects found', 'no_projects');
        // REVIEW should I return the empty option or nothing at all?

        await ack({
          options: noProjectsOption,
        });

        // await ack();
      }
    } catch (error) {
      console.error(error);
    }
  });
}

exports.githubOrgSelectInput = githubOrgSelectInput;
exports.orgLevelProjectInput = orgLevelProjectInput;
