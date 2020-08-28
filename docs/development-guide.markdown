---
layout: page
title: Development Guide
permalink: /dev-guide/
---

# Development Guide

## Setting up your own instance of GitWave

GitWave consists of 3 parts:
1. The Slack App (which can be deployed on Heroku, AWS etc)
2. The MongoDB backend - where GitWave stores team and user data
3. The GitHub App component - which the Slack app uses for authenticating with the GitHub API. 


### Setting up the Slack App

1. Create a development workspace [here](https://slack.com/create) (*optional*)

2. Create a new Slack app [here](https://api.slack.com/apps?new_app=1)

3. Go to **Features > OAuth & Permissions** in the left pane
  - Scroll down to **Scopes > Bot Token Scopes** section
  - Click **Add an OAuth Scope** button
  - Add `channels:join`, `chat:write`, `channels:read`, `channels:manage`, `groups:write`, `groups:read`, `im:write`, `im:read`, `reactions:read`, `reactions:write`

4. Got to **Settings > Install App** in the left pane
  - Click **Install App to Workspace** button
  - Click **Allow** button in the OAuth confirmation page
  - Save the **Bot User OAuth Access Token** value (xoxb-***)

5. Go to **Settings > Basic Information** in the left pane
  - Scroll down to **App Credentials** section
  - Click **Show** button in **Signing Secret** section
  - Save the **Signing Secret** value