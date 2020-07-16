class TriageTeamData {
  constructor() {
    this.team_channel_id = '';
    // This should be a mapping from team_channel_id ->
    this.team_data = {
      subscribed_repo_map: new Map(),
      team_members: new Map(),
    };
  }

  set_team_member(slack_user_id, github_username = 'no github username set') {
    this.team_data.team_members.set(slack_user_id, github_username);
    console.log(`Slack user ${slack_user_id} added to team`);
  }

  get_team_member_by_github_username(potential_github_username) {
    for (const [slack_user_id, github_username] of this.team_data.team_members) {
      if (github_username === potential_github_username) {
        return [slack_user_id, github_username];
      }
    }
    return [];
  }

  subscribe_to_repo(repo_obj) {
    if (this.team_channel_id.length === 0) {
      console.log(
        `Cannot subscribe to ${repo_obj.repo_path}. User must first create a triage team.`
      );
    }

    this.team_data.subscribed_repo_map.set(repo_obj.repo_path, repo_obj);
    console.log(`Subscribed to ${repo_obj.repo_path} successfully!`);
  }

  // If a repo path is given, get that repo object. Otherwise, just return all
  get_team_repo_subscriptions(repo_path = '') {
    return repo_path.length === 0
      ? this.team_data.subscribed_repo_map
      : this.team_data.subscribed_repo_map.get(repo_path);
  }

  assign_team_channel(channel_id) {
    this.team_channel_id = channel_id;
    return this.team_channel_id;
  }
}

module.exports = TriageTeamData;
