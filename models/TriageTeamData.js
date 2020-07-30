const parseGH = require('parse-github-url');
const {query, graphql, mutation} = require('../graphql');
const {
  add_new_team_members,
  update_document,
  find_triage_team_by_slack_user,
  find_documents,
} = require('../db');

/* This is where all the DB operations are abstracted to. The goal is to avoid directly using the mongodb client methods throughout the 
code (ex. update, find, set etc) and instead abstract the functionalities here (ex. assign label to issue -- which will do all the mongodb calls under the hood) */
class TriageTeamData {
  constructor() {
    this.team_discussion_channel_id = '';
    this.team_internal_triage_channel_id = '';

    this.team_data = {
      subscribed_repo_map: new Map(),
      team_members: new Map(),
    };
    // TODO HIGHEST PRIORITY change all instances of untriaged project to be here
    this.team_untriaged_org_project = {
      project_name: '',
      project_id: '',
      project_columns: new Map(),
    };
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
    // TODO remove this conditionality since a default untriaged project should always be assigned if a team exists
    return untriaged_project_obj.project_name.length !== 0 ||
      untriaged_project_obj.project_id.length !== 0
      ? untriaged_project_obj
      : {};
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

  /**
   * Creates a repo object
   *
   * @memberof TriageTeamData
   * @param {string} subscribe_repo_path
   * @returns {{
   *   repo_owner: string;
   *   repo_name: string;
   *   repo_path: string;
   *   untriaged_settings: {
   *     label_id: string;
   *     label_name: string;
   *     team_untriaged_org_project: {project_name: string; project_id: string};
   *   };
   *   repo_label_map: Map<string, object>;
   *   repo_project_map: Map<string, object>;
   * }} A repo object
   */
  // Creates a new repo object
  // TODO get rid of this since the subscription/unsubscription process is automated now
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
    };
    const repo_obj_data = await this.get_basic_new_repo_data(repo_obj);
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
   * Gets all the repo data with all the projects
   *
   * @memberof TriageTeamData
   * @param {{owner; name}} repo_details
   * @static
   * @returns {any}
   */
  // TODO incorporate this with the setup modal since subscriptions are handled automatically now
  static async get_basic_new_repo_data(repo_obj) {
    console.log('repo obj', repo_obj);
    const {repo_owner, repo_name} = repo_obj;
    // TODO this will need installation ID
    const repo_data_response = await graphql.call_gh_graphql(query.getNewRepoBasicData, {
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

  static async add_team_members(slack_user_ids, triage_team_channel) {
    return add_new_team_members(slack_user_ids, triage_team_channel);
  }

  /**
   * Fetches the cards of a column given its Node ID
   *
   * @memberof TriageTeamData
   * @param {String} column_id
   * @static
   * @returns {[Cards]}
   */
  static async get_cards_by_column(column_id, installation_id) {
    const column_data_response = await graphql.call_gh_graphql(
      query.getCardsByProjColumn,
      {
        column_id,
        installation_id,
      }
    );
    return column_data_response.node.cards.nodes;
  }

  static async associate_team_with_installation(
    slack_user_ids,
    team_channel_id,
    team_internal_triage_channel_id,
    selected_github_org
  ) {
    const team_member_obj = slack_user_ids.reduce((accumulator, currentValue) => {
      accumulator[currentValue] = null;
      return accumulator;
    }, {});

    const filter = {'org_account.node_id': selected_github_org.value};

    const new_obj = {
      team_channel_id,
      team_internal_triage_channel_id,
      internal_triage_items: {},
      team_members: team_member_obj,
    };
    return update_document(filter, new_obj);
  }

  static async set_org_level_project(project_obj, installation_id) {
    const org_proj_data_response = await graphql.call_gh_graphql(
      query.getOrgProjectBasicData,
      {org_proj_id: project_obj.project_id},
      installation_id
    );

    const project_columns = org_proj_data_response.node.columns.nodes;

    const project_columns_map = project_columns.reduce(
      (obj, column) => ({...obj, [column.name]: column}),
      {}
    );

    console.log(': -----------------------------------------------------------------');
    console.log('set_org_level_project -> project_columns_map', project_columns_map);
    console.log(': -----------------------------------------------------------------');

    const project_obj_with_columns = {...project_obj, ...project_columns_map};

    const filter = {'gitwave_github_app_installation_id': installation_id};

    const new_obj = {
      org_level_project_board: project_obj_with_columns,
    };

    return update_document(filter, new_obj);
  }

  static async set_user_github_username(slack_user_id, github_username) {
    // RegExp for checking the username
    const github_username_checker = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

    const valid_github_username = github_username_checker.test(github_username);

    console.log(': --------------------------------------------');
    console.log('valid_github_username', valid_github_username);
    console.log(': --------------------------------------------');

    if (!valid_github_username) {
      console.error('Invalid GH username');
      throw Error('invalid_github_username');
    }

    const username_update_obj = {};

    username_update_obj[`team_members.${slack_user_id}`] = github_username;

    const db_user_filter = {};

    db_user_filter[`team_members.${slack_user_id}`] = {$exists: true};

    return update_document(db_user_filter, username_update_obj);
  }

  static async get_github_username_by_user_id(slack_user_id) {
    // First we check to see if the user has already mapped a github username
    const triage_team_members_response = await find_triage_team_by_slack_user(
      slack_user_id,
      {team_members: 1}
    );

    const slack_id_to_gh_username_match =
      triage_team_members_response[0].team_members[slack_user_id];

    console.log(': ------------------------------------------------------------');
    console.log(
      '1 slack_id_to_gh_username_match.team_members',
      slack_id_to_gh_username_match
    );
    console.log(': ------------------------------------------------------------');
    return slack_id_to_gh_username_match;
  }

  static async get_user_id_by_github_username(github_username, installation_id) {
    // First we check to see if the user has already mapped a github username
    const triage_team_members_response = await find_documents(
      {
        gitwave_github_app_installation_id: installation_id,
      },
      {team_members: 1}
    );

    const {team_members} = triage_team_members_response[0];

    const gh_username_to_slack_id_match = Object.keys(team_members).find(
      key => team_members[key] === github_username
    );

    console.log(': ------------------------------------------------------------');
    console.log(
      '1 slack_id_to_gh_username_match.team_members',
      gh_username_to_slack_id_match
    );
    console.log(': ------------------------------------------------------------');
    return gh_username_to_slack_id_match;
  }

  static async add_labels_to_card(slack_user_id, {issue_id, label_id}) {
    const db_user_filter = {};

    db_user_filter[`team_members.${slack_user_id}`] = {$exists: true};

    try {
      const db_query = await find_documents(db_user_filter, {
        gitwave_github_app_installation_id: 1,
      });

      const installation_id = db_query[0].gitwave_github_app_installation_id;

      const variables_clearAllLabels = {
        element_node_id: issue_id,
      };

      await graphql.call_gh_graphql(
        mutation.clearAllLabels,
        variables_clearAllLabels,
        installation_id
      );

      const variables_addLabelToIssue = {
        element_node_id: issue_id,
        label_ids: [label_id],
      };

      await graphql.call_gh_graphql(
        mutation.addLabelToIssue,
        variables_addLabelToIssue,
        installation_id
      );

      /* TODO if the label was assigned successfully, update the app home view so that either the issue card is removed 
      from the page or the triage button that was clicked turns green */
    } catch (error) {
      console.error(error);
    }
  }

  static async get_repo_untriaged_label(repo_node_id, installation_id) {
    const getIdLabel_vars = {
      label_name: 'Untriaged',
      repo_id: repo_node_id,
    };

    const untriaged_label_response = await graphql.call_gh_graphql(
      query.getIdLabel,
      getIdLabel_vars,
      installation_id
    );
    return untriaged_label_response.node.label.id;
  }

  static async get_team_channel_id(installation_id) {
    const team_discussion_channel_id = await find_documents(
      {
        gitwave_github_app_installation_id: installation_id,
      },
      {team_channel_id: 1}
    );

    return team_discussion_channel_id[0].team_channel_id;
  }

  static async get_team_org_level_project_board(installation_id) {
    const org_level_project_board_response = await find_documents(
      {
        gitwave_github_app_installation_id: installation_id,
      },
      {org_level_project_board: 1}
    );

    return org_level_project_board_response[0].org_level_project_board;
  }
}

exports.TriageTeamData = TriageTeamData;
