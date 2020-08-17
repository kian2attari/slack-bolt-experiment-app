# GitWave 🌊

[Docs](https://www.gitwave.com)

## What the app does

A Slack app that integrates with your team's issue triaging workflow to make it more structured and efficient. It provides a single hub for triaging internal and external issue reports, manages the team’s triage rotation according to your rules, and provides Slack notifications whenever you are mentioned on GitHub (among other notifications that the official GitHub Slack integration lacks).

GitWave uses its GitHub app counterpart in order to access a team's GitHub repos. GitHub App authentication is a more restrictive alternative to the OAuth authentication that most apps use as it only gives the app access to repos/organizations that the GitHub App is installed on, rather than providing blanket access to all of a user's repos/organization

### Features (Proposed 🤔,  Planned 🔖,  In Progress 🔨,  Done  ✅)

- ✅ The user can create triage team(s) on the app and assign them to the repos they are responsible for
- ✅ Newly-created issues are automatically given an untriaged label, assigned to a designated project, and placed in it’s specified need’s triage column
- ✅ DM team members whenever they are mentioned (@’ed), or when someone requests a pull request review from them on GitHub
- ✅ Message the specified triage team channel whenever someone comments on a closed issue
- ✅ Manage issues, view their current labels, and assign new labels all on the App Home page
- ✅ Assigned issues are automatically moved to the In Progress column
- ✅ Closed issues are automatically moved to the Done column
- ✅ I ssues labeled question are automatically moved to the Questions column
- ✅  Automatically remove the untriaged label and move the issue to the To Do (to be assigned column)
- ✅  Assign issues to yourself or other people right on the App Home Page
- ✅  Setup automated weekly “on triage duty” assignments for the triage team(s) with the option for users to mark unavailability for a week and redelegate the responsibility.
- ✅  Two way sync between the single all-repo project board and the individual project boards

- 🔖  Automatically turn TODOs in the code to issues (a specific marker like @TODO-ISSUE could be used to make it so that not all TODO’s are turned into issues)
- 🔖  A better way to find potentially-related/duplicate issues with the click of a button

- 🤔  Automate the release process
- 🤔  Automatically mark issues
- 🤔  Automatically move stale issues to a ‘waiting on response’ column (rather than a stale label)
- 🤔  Collect up all the ‘done’ items by each person and compile them into a personalized ‘weekly wins’ notification
- 🤔  Filter issues on the App Home page by project, label, or column

## Setup

### Prerequisites

For GitWave to work properly, you'll need to have set up a GitHub organization that:

- **Has an organization-level project board**: This is used by GitWave to provide an umbrella view across all repos.
- **Contains all the repos that the team is responsible for triaging:** GitWave does not need access to all the repos in an organization, however, since GitHub app installations happen on an organization level (even if the scope is limited to a single repo), it is important that the repos for a single team be under a single organization.
  
In addition, each of the repos should have at least 1 *triage label* in their set of labels. GitWave will treat a label as a triage label if the label's description starts with  `M-T:`

![Triage label example](https://i.ibb.co/4F6VvJ5/Screen-Shot-2020-08-17-at-1-58-22-PM.png)

## Usage

```bash
npm start
```
