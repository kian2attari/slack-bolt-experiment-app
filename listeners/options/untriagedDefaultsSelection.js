const {SubBlocks} = require('../../blocks');
const {SafeAccess} = require('../../helper-functions');
const {query, graphql} = require('../../graphql');
const {find_documents} = require('../../db');

function setup_defaults_repo_selection(app, triage_team_data_obj) {
  app.options('setup_defaults_repo_selection', async ({options, ack}) => {
    try {
      // TODO try using options directly
      console.log('options', options);

      const subscribed_repos = triage_team_data_obj.get_team_repo_subscriptions();

      console.log('subscribed_repos', subscribed_repos);

      if (subscribed_repos.size !== 0) {
        // const repo_options_block_list = Array.from(subscribed_repos.keys(), repo => {
        //   return SubBlocks.option_obj(repo);
        // });
        const repo_options_block_list = Array.from(subscribed_repos.keys()).map(repo => {
          return SubBlocks.option_obj(repo);
        });

        console.log('repo_options_block_list', repo_options_block_list);

        await ack({
          options: repo_options_block_list,
        });
      } else {
        const no_subscribed_repos_option = SubBlocks.option_obj(
          'No repo subscriptions found',
          'no_subscribed_repos'
        );
        // REVIEW should I return the empty option or nothing at all?

        await ack({
          options: no_subscribed_repos_option,
        });

        // await ack();
      }
    } catch (error) {
      console.error(error);
    }
  });
}
/**
 * Gets a list of all the orgs/accounts that gitwave is installed on. This includes
 * repo-level installations.
 *
 * @param {any} app
 */
function github_org_select_input(app) {
  // eslint-disable-next-line no-unused-vars
  app.options('github_org_select_input', async ({options, ack}) => {
    try {
      // TODO get a list of the orgs that the app has access to via DB
      // The query paramater is empty since we want to return all installations
      const orgs_response_array = await find_documents({}, {org_account: 1});

      console.log(
        ': ---------------------------------------------------------------------------'
      );
      console.log(
        'function github_org_select_input -> orgs_response_array',
        orgs_response_array
      );
      console.log(
        ': ---------------------------------------------------------------------------'
      );

      if (orgs_response_array.size !== 0) {
        // Creates the options blocks out of the orgs
        const org_options_block_list = orgs_response_array.map(org => {
          return SubBlocks.option_obj(org.org_account.login, org.org_account.node_id);
        });

        console.log('org_options_block_list', org_options_block_list);

        await ack({
          options: org_options_block_list,
        });
      } else {
        const no_orgs_option = SubBlocks.option_obj('No orgs found', 'no_orgs');
        // REVIEW should I return the empty option or nothing at all?

        await ack({
          options: no_orgs_option,
        });
      }
    } catch (error) {
      console.error(error);
    }
  });
}

function org_level_project_input(app) {
  app.options('org_level_project_input', async ({options, ack}) => {
    try {
      const db_user_filter = {};

      db_user_filter[`team_members.${options.user.id}`] = {$exists: true};

      const db_query = await find_documents(db_user_filter, {
        gitwave_github_app_installation_id: 1,
      });

      console.log(': -----------------------------------------------------');
      console.log('function org_level_project_input -> db_query', db_query);
      console.log(': -----------------------------------------------------');

      const installation_id = db_query[0].gitwave_github_app_installation_id;

      const org_or_user_id = JSON.parse(options.view.private_metadata)
        .selected_org_node_id;

      console.log(': -----------------------------------------------------------------');
      console.log('function org_level_project_input -> org_or_user_id', org_or_user_id);
      console.log(': -----------------------------------------------------------------');

      const org_level_projects_response = await graphql.call_gh_graphql(
        query.getOrgAndUserLevelProjects,
        {org_or_user_id},
        installation_id
      );
      const org_level_projects = SafeAccess(
        () => org_level_projects_response.node.projects.nodes
      );

      if (org_level_projects.size !== 0) {
        const project_options_block_list = Array.from(org_level_projects.values()).map(
          project => {
            return SubBlocks.option_obj(project.name, project.id);
          }
        );

        console.log('project_options_block_list', project_options_block_list);

        await ack({
          options: project_options_block_list,
        });
      } else {
        const no_projects_option = SubBlocks.option_obj(
          'No projects found',
          'no_projects'
        );
        // REVIEW should I return the empty option or nothing at all?

        await ack({
          options: no_projects_option,
        });

        // await ack();
      }
    } catch (error) {
      console.error(error);
    }
  });
}

function setup_default_triage_label_list(app, triage_team_data_obj) {
  app.options('setup_default_triage_label_list', async ({options, ack}) => {
    try {
      console.log('options', options);

      const selected_repo_metadata_obj = JSON.parse(options.view.private_metadata);
      // TODO if the options value specified a repo_path, then set that as the currently selected_repo_path
      // Get information specific to a team or channel
      const currently_selected_repo_path = selected_repo_metadata_obj.repo_path;

      const currently_selected_repo_map = triage_team_data_obj.get_team_repo_subscriptions(
        currently_selected_repo_path
      );

      const options_response = Array.from(
        currently_selected_repo_map.repo_label_map.values()
      ).map(label => {
        return {
          'text': {
            'type': 'plain_text',
            'text': label.name,
          },
          'value': label.id,
        };
      });
      await ack({
        'options': options_response,
      });
    } catch (error) {
      console.error(error);
    }
  });
}

module.exports = {
  setup_defaults_repo_selection,
  github_org_select_input,
  setup_default_triage_label_list,
  org_level_project_input,
};
