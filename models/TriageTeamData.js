const parseGH = require('parse-github-url');
const {query, graphql} = require('../graphql');

class TriageTeamData {
  constructor() {
    this.team_discussion_channel_id = '';
    this.team_internal_triage_channel_id = '';
    // This should be a mapping from team_discussion_channel_id ->
    this.team_data = {
      subscribed_repo_map: new Map(),
      team_members: new Map(),
    };
    // TODO HIGHEST PRIORITY change all instances of untriaged project to be here
    this.team_untriaged_org_project = {
      project_name: '',
      project_id: '',
    };
  }

  set_team_member(slack_user_id, github_username = 'no github username set') {
    this.team_data.team_members.set(slack_user_id, github_username);
    console.log(
      `Slack user ${slack_user_id} added to team with github username ${github_username}`
    );
  }

  get_team_member_by_github_username(potential_github_username) {
    for (const [slack_user_id, github_username] of this.team_data.team_members) {
      if (github_username === potential_github_username) {
        return {slack_user_id, github_username};
      }
    }
    return {};
  }

  // TODO change this so that only a repo_path needs to be passed in and it will use new_repo_obj function
  subscribe_to_repo({repo_path}) {
    // TODO enforce this. Currently it just console logs to make testing and development less annoying
    if (this.team_discussion_channel_id.length === 0) {
      console.log(
        `Cannot subscribe to ${repo_path}. User must first create a triage team.`
      );
    }
    TriageTeamData.new_repo_obj(repo_path).then(result => {
      this.team_data.subscribed_repo_map.set(repo_path, result);
    });
    console.log(`Subscribed to ${repo_path} successfully!`);
  }

  // If a repo path is given, get that repo object. Otherwise, just return all
  get_team_repo_subscriptions(repo_path = '') {
    return repo_path.length === 0
      ? this.team_data.subscribed_repo_map
      : this.team_data.subscribed_repo_map.get(repo_path);
  }

  get_default_untriaged_project() {
    const untriaged_project_obj = this.team_untriaged_org_project;
    // If a default project hasn't been set, return an empty object
    return untriaged_project_obj.project_name.length !== 0 ||
      untriaged_project_obj.project_id.length !== 0
      ? untriaged_project_obj
      : {};
  }

  set_default_untriaged_project(project_obj) {
    return Object.assign(this.team_untriaged_org_project, project_obj);
  }

  get_untriaged_label(repo_path) {
    return this.team_data.subscribed_repo_map.get(repo_path).untriaged_settings
      .untriaged_label;
  }

  set_untriaged_label(repo_path, label_obj) {
    return Object.assign(
      this.team_data.subscribed_repo_map.get(repo_path).untriaged_settings
        .untriaged_label,
      label_obj
    );
  }

  assign_team_channel(discussion_channel_id, team_internal_triage_channel_id) {
    this.team_discussion_channel_id = discussion_channel_id;
    this.team_internal_triage_channel_id = team_internal_triage_channel_id;
    return {
      team_discussion_channel_id: this.team_discussion_channel_id,
      team_internal_triage_channel_id: this.team_internal_triage_channel_id,
    };
  }

  get_cards_by_column(repo_path, project_name, column_name) {
    return this.get_team_repo_subscriptions(repo_path)
      .repo_project_map.get(project_name)
      .columns.get(column_name).cards.nodes;
  }

  /**
   *
   * Creates a repo object
   * @param {string} subscribe_repo_path
   * @returns {{repo_owner: string, repo_name: string, repo_path: string, untriaged_settings: { label_id: string, label_name: string, team_untriaged_org_project: {project_name:string, project_id:string }}, repo_label_map: Map<string,object>, repo_project_map: Map<string,object>}} A repo object
   * @memberof TriageTeamData
   */
  // Creates a new repo object
  static async new_repo_obj(subscribe_repo_path) {
    const {owner, name, repo} = parseGH(subscribe_repo_path);
    if (!(owner && name && repo)) throw new Error('Invalid GitHub repo URL!');
    // TODO fix the methods
    const repo_obj = {
      repo_owner: owner,
      repo_name: name,
      repo_path: repo,
      // The properties below have to be gotten from an API call
      // TODO builtin method in this object/class to do the API call
      repo_id: '',
      repo_label_map: new Map(),

      untriaged_settings: {
        // REVIEW should I make the label_name property a global  property rather than having to select it for each repo?
        untriaged_label: {
          label_id: '',
          label_name: '',
        },
      },
      // Projects are mapped from project_name -> {project_id, project_columns_map:}
      repo_project_map: new Map(),
      // // TODO turn this get_cards_by_column method into a class method
      // get_cards_by_column(project_name, column_name) {
      //   return this.repo_project_map.get(project_name).columns.get(column_name).cards
      //     .nodes;
      // },
    };
    const repo_obj_data = await this.get_full_repo_data(repo_obj);
    console.log(': --------------------------------------------');
    console.log('new_repo_obj -> repo_obj_data', repo_obj_data);
    console.log(': --------------------------------------------');

    const filled_repo_obj = Object.assign(repo_obj, repo_obj_data);
    console.log(': ------------------------------------------------');
    console.log('new_repo_obj -> filled_repo_obj', filled_repo_obj);
    console.log(': ------------------------------------------------');

    return filled_repo_obj;
  }

  /**
   * Gets all the repo data with all the projects and columns and cards
   *
   * @static
   * @param {{owner, name}} repo_details
   * @returns
   * @memberof TriageTeamData
   */
  static async get_full_repo_data(repo_obj) {
    console.log('repo obj', repo_obj);
    const {repo_owner, repo_name} = repo_obj;

    const repo_data_response = await graphql.call_gh_graphql(query.getFullRepoData, {
      repo_owner,
      repo_name,
    });

    console.log(repo_data_response);

    // There was an error!
    // TODO Improve this error
    if (Object.prototype.hasOwnProperty.call(repo_data_response, 'error_type')) {
      throw new graphql.Graphql_call_error(
        repo_data_response.error_type,
        repo_data_response.error_list
      );
    }

    const label_nodes_list = repo_data_response.repository.labels.nodes;
    const project_nodes_list = repo_data_response.repository.projects.nodes;
    // Turn the labels into a Map for quick reference + iteration
    const repo_label_map = new Map(
      label_nodes_list.map(label_obj => [label_obj.name, label_obj])
    );
    // REVIEW can this be made more efficient?
    // Turning the GitHub response object to use Maps not nested objects/arrays
    const repo_project_map = new Map(
      project_nodes_list.map(project => {
        const project_obj = project;
        project_obj.columns = new Map(
          project_obj.columns.nodes.map(column => [column.name, column])
        );
        return [project_obj.name, project_obj];
      })
    );

    const processed_object = {
      repo_id: repo_data_response.repository.id,
      repo_label_map,
      repo_project_map,
    };

    console.log('processed_object', processed_object);

    return processed_object;
  }
}

module.exports = TriageTeamData;
