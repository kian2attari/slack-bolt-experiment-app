---
layout: page
title: Development Guide
permalink: /dev-guide/
---

<!-- prettier-ignore-start -->
# Development Guide
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }
<!-- prettier-ignore-end -->

<!-- prettier-ignore -->
- TOC
{:toc}

## Setting up your own instance of GitWave

GitWave consists of 3 parts:

1. The Slack App (which can be deployed on Heroku, AWS etc)
2. The MongoDB backend - where GitWave stores team and user data
3. The GitHub App component - which the Slack app uses for authenticating with the GitHub API.

The first step is to setup the code for GitWave's Slack App onto a hosting platform. You can click the button in step 1 to automatically setup on Heroku!

**Note:** The app will not work if you deploy it as there are some environment variables that have to be set up.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### Setting up the MongoDB database

You can use any platform you like to host the DB instance. The option used here is [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

You can also name the Cluster and DB whatever you like, just make sure to have these 2 collections present: `gitwave_user_data` and `gitwave_team_data`. GitWave looks for these collections to store user and team data respectively.

- **Note** the **DB URI** which is in the format: `mongodb+srv://<DB user id>:<DB user password>@<cluster name>.abcdefg.mongodb.net/<DB name>?retryWrites=true&w=majority`. Set this up as the value of the `DB_URI` environment variable.

### Setting up the GitHub app

Now we need to create the GitHub app counterpart of GitWave that the Slack app will use for authentication purposes in order to interact with the GitHub API. You can read more

1. Create a [new GitHub App](https://github.com/settings/apps/new)

2. Set the webhook URL in the following format: `https://<your_domain>/gh-webhook`. `your_domain` would depend on where you've hosted your GitWave app ex: `abasd12asdas.ngrok.io` or `gitwave-dev.herokuapp.com`.

3. In the **Repository permissions** section, GitWave needs access to:

   |   Permission    | Scope needed |
   | :-------------: | :----------: |
   |    `Issues`     | Read & Write |
   | `Pull requests` | Read & Write |
   |   `Projects`    | Read & Write |

4. In the **Organization permissions** section, GitWave needs access to:

   | Permission | Scope needed |
   | :--------: | :----------: |
   | `Projects` | Read & Write |

5. In the **Subscribe to events** section, you must subscribe to the following:

   |          Event Name           |
   | :---------------------------: |
   |        `Issue comment`        |
   |            `Label`            |
   |           `Project`           |
   |       `Project column`        |
   |        `Pull request`         |
   |           `Issues`            |
   |        `Project card`         |
   |     `Pull request review`     |
   | `Pull request review comment` |

   Note: The GitWave Slack app doesn't currently have the listeners for all of these events. They are being added!

6. Create the App!

7. **Note** the App ID of the GitHub App you just created. Set this up as the value of the `APP_ID` environment variable.

8. Generate a private key and **note** it down. Set this up as the value of the `PRIVATE_KEY` environment variable.

### Setting up the Slack App

1.  Create a development workspace [here](https://slack.com/create) (_optional_)

1.  Create a new Slack app [here](https://api.slack.com/apps?new_app=1)

1.  Go to **Features > OAuth & Permissions** in the left pane

1.  Scroll down to **Scopes > Bot Token Scopes** section

1.  Click **Add an OAuth Scope** button

1.  Add `channels:join`, `chat:write`, `channels:read`, `channels:manage`, `groups:write`, `groups:read`, `im:write`, `im:read`, `reactions:read`, `reactions:write`

1.  Got to **Settings > Install App** in the left pane

1.  Click **Install App to Workspace** button

1.  Click **Allow** button in the OAuth confirmation page

1.  **Note** this **Bot User OAuth Access Token** value (xoxb-\*\*\*). Set this up as the value of the `SLACK_BOT_TOKEN` environment variable.

1.  Go to **Settings > Basic Information** in the left pane

1.  Scroll down to **App Credentials** section

1.  Click **Show** button in **Signing Secret** section

1.  **Note** this **Signing Secret** value. Set this up as the value of the `SLACK_SIGNING_SECRET` environment variable.

1.  Go to **Features > App Home**

1.  Enable the **Home Tab** under **_Show tabs_**

1.  Go to **Features > Interactivity & Shortcuts**

1.  Set the **Request URL** to: `https://<your_domain>/slack/events`. `your_domain` would depend on where you've hosted your GitWave app ex: `abasd12asdas.ngrok.io` or `gitwave-dev.herokuapp.com`.

1.  Set the **Options Load URL** under **Select Menus** to: `https://<your_domain>/slack/events`.

1.  Create the following 3 Global shortcuts:

    |      Shortcut Name       |                                                                 Shortcut Description                                                                  |          Callback ID          |
    | :----------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------: | :---------------------------: |
    | Triage Duty Availability |                                          See who's up for triage and edit your availability for triage duty                                           | edit_triage_duty_availability |
    | Add/Edit GitHub Username | Add or Modify the GitHub username that is currently mapped to your Slack user ID. GitWave needs this mapping for features like GitHub mention notifs! |    modify_github_username     |
    | Create/Edit triage team  |  Here you can edit triage team members and the channels associated with the team's triaging flow. For new teams, you also map them to a GitHub Org.   |     setup_triage_workflow     |

1.  Go to **Features > Event Subscriptions**

1.  Set the **Request URL** to: `https://<your_domain>/slack/events`

1.  Subscribe to the following events:

    |     Event Name     |
    | :----------------: |
    | `app_home_opened`  |
    |  `reaction_added`  |
    | `reaction_removed` |
    | `message.channels` |
