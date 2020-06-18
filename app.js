const { App, ExpressReceiver } = require('@slack/bolt');
const express  = require('express');
const { query, mutation, graphql } = require('./graphql')
const { AppHome, AppHomeProjectSelected } = require('./blocks')


// Create a Bolt Receiver
const expressReceiver = new ExpressReceiver({ signingSecret: process.env.SLACK_SIGNING_SECRET });

// Initializes your app with your bot token, signing secret, and receiver
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: expressReceiver
});

// State object to map GH usernames to Slack usernames
let gh_slack_username_map = {};

// Temporary hardcoding of channel id
// TODO: Remove this hardcoding
/* The data object for this could be a mapping from '{repo_owner}/{repo_name} -> [Array of channel ID's]
Everytime someone subscribes to a owner/repo, add their channel to the array with the key of that owner/repo
When any sort of event concerns that repo, post the message to all channels in the array 
A similar thing can be done to map to map repos to project boards */
const temp_channel_id = 'C015FH00GVA';

const gh_variables_init = {
  repo_owner: 'slackapi',
  repo_name: 'dummy-kian-test-repo'
}


// Declaring some variables to be passed to the GraphQL APIs

const variables_getCardsByProj = Object.assign({ number: 1 }, gh_variables_init);


const variables_getFirstColumnInProject = Object.assign({ project_name: "Slack dummy-test"}, gh_variables_init);


const variables_get_untriaged_label_id = Object.assign({label_name: "untriaged"}, gh_variables_init)


// TODO: Add cards automatically to Needs Traige when they are labelled with the unlabelled tag
// graphql.call_gh_graphql(query.getFirstColumnInProject, variables_getFirstColumnInProject);


let untriaged_label_id;

graphql.call_gh_graphql(query.getIdLabel, variables_get_untriaged_label_id, gh_variables_init).then((response) => {
  const extracted_label_id = response.repository.label.id;
    console.log('untriaged_label_id: ' + extracted_label_id);
    untriaged_label_id =  extracted_label_id
  }
).catch((error) => {
  console.error(error)
})





/* -------------------------------------------------------------------------- */
/*                         ANCHOR Listening for events                        */
/* -------------------------------------------------------------------------- */


/* --------------------- SECTION LISTENING FOR MESSAGES --------------------- */

// Listens to incoming messages that contain 'yo bot' and responds. This is just for testing.
app.message('yo bot', async ({ message, say}) => {

// note: say() sends a message to the channel where the event was triggered
  await say({
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `Hey there human <@${message.user}>!`
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Click Me"
          },
          "action_id": "test_click"
        }
      }
    ]
  });
});






/* ---------------------- SECTION LISTENING FOR EVENTS ---------------------- */



// Listens for instances where the bot is mentioned, beginning step for mapping GH -> Slack usernames
app.event('app_mention', async ({ event, context }) => {
  try {

    // The first word is the mention, the second should be the username
    let github_username = event.text.split(" ")[1];

    const result = await app.client.chat.postMessage({
      token: context.botToken,
      channel: temp_channel_id,
      blocks: map_ghusername_to_slack_message(event.user,github_username),
      text: `Hey there <@${event.user}>! Please make sure that GitHub username is right!`
    });
    console.log(result);
  }
  catch (error) {
    console.error(error);
  }
});



/* -------------------------- ANCHOR App Home View -------------------------- */

// Loads the app home when the app home is opened!

app.event('app_home_opened', async ({ event, context, client }) => {
  try {
    console.log(event); 
    console.log(AppHome)
    /* view.publish is the method that your app uses to push a view to the Home tab */
    const result = await client.views.publish({

      /* retrieves your xoxb token from context */
      token: context.botToken,

      /* the user that opened your app's app home */
      user_id: event.user,

      /* the view payload that appears in the app home*/
      view: AppHome
    });
  }
  catch (error) {
    console.error(error);
  }
});




// TODO: Create project cards directly from slack

// TODO: Delete project cards directly from slack

// TODO: Move project cards directly from slack

// TODO: View all the project cards in Needs Triage directly on slack



/* ------------- SECTION Portion of app that listens for actions ------------ */


app.action('test_click', async ({body, ack, say}) => {
  
  // Here we acknowledge receipt

  await ack();

  await say(`<@${body.user.id}>, thanks for clicking my button bro. That's respect :100:`);
});

app.action('connect_account', async ({body, ack, say}) => {
  
  // Here we acknowledge receipt

  await ack();

  console.log(body);

  let github_username = body.actions[0].value;
  let slack_username = body.user.id;

  // We map the github username to that Slack username
  gh_slack_username_map[github_username] = slack_username;

  console.log(gh_slack_username_map);

  await say(`<@${body.user.id}>, your slack and github usernames were associated successfully!`);
});

/* ------------- ANCHOR Responding to the project name selection ------------ */

app.action('project_list', async ({ ack, body, context, client }) => {
  await ack();

  try {

    let action_body = body.actions[0]

    let selected_option = action_body.selected_option


    /* view.publish is the method that your app uses to push a view to the Home tab */
    const result = await client.views.update({

      /* retrieves your xoxb token from context */
      token: context.botToken,

      /* View to be updaed */
      view_id: body.view.id,

      /* the view payload that appears in the app home*/
      view: AppHomeProjectSelected(selected_option)
    });
  }
  catch (error) {
    console.error(error);
  }
  
  
});

/* ----------------------- SECTION Listen for options ----------------------- */

// Responding to an project_list options request with a list of projects
app.options('project_list', async ({ options, ack }) => {
  try {
    // Get information specific to a team or channel
    const results = await graphql.call_gh_graphql(query.getProjectList, gh_variables_init);

    if (results) {

      const projects = results.repository.projects.nodes
      let options_response = [];

      // Collect information in options array to send in Slack ack response
      projects.forEach((project) => {
        options_response.push({
          "text": {
            "type": "plain_text",
            "text": project.name
          },
          "value": `${project.number}`
        });
      })

      await ack({
        "options": options_response
      });
    } else {
      await ack();
    }

  }
  catch(error) {
    console.error(error)
  }
});



// Acknowledges button clicks
// TODO: Possibly change the Bolt library so that link buttons dont have to be responded to
app.action('link_button', ({ ack }) => ack());



// Parsing JSON Middleware
expressReceiver.router.use(express.json())

// Receive github webhooks here!
expressReceiver.router.post('/webhook', (req, res) => {

  if (req.headers['content-type'] !== 'application/json') {
    return res.send('Send webhook as application/json');
  }

  try {
      let request = req.body;
      let action = request.action;

      // TODO: use issue number to query for a specific issue
      let issue_number = request.issue.number;
      let issue_node_id = request.issue.node_id;

      // TODO: Handle other event types. Currently, it's just issue-related events
      if (req.headers['x-github-event'] == 'issues' ) {
        let issue_url = request.issue.html_url;
        let issue_title = request.issue.title;  
        let issue_body = request.issue.body;
        let issue_creator = request.issue.user.login;
        let creator_avatar_url = request.issue.user.avatar_url;
        let issue_create_date = new Date(request.issue.created_at);
        
        // QUESTION: Should editing the issue also cause the untriaged label to be added?
        if (action == "opened" || action == "reopened") {

          const variables_addLabelToIssue = {
            element_node_id: issue_node_id,
            label_id: untriaged_label_id
          }

          graphql.call_gh_graphql(mutation.addLabelToIssue, variables_addLabelToIssue, gh_variables_init);

          check_for_mentions(temp_channel_id, issue_title, issue_body, issue_url, issue_creator, creator_avatar_url, issue_create_date);
        }
      
        
      }

      else if (req.headers['x-github-event'] == 'issue_comment') {
        let issue_url = request.issue.html_url;
        let issue_title = request.issue.title;  
        let comment_body = request.comment.body;
        let comment_creator = request.comment.user.login;
        let creator_avatar_url = request.comment.user.avatar_url;
        let comment_create_date = new Date(request.comment.created_at);

        // TODO: New comment on closed issue!
        if (req.body.issue.state == 'closed') {
          mention_message(temp_channel_id, `Comment on closed issue: ${issue_title}`, comment_body, issue_url, comment_creator, creator_avatar_url, comment_create_date, '!channel', true)
        }

        check_for_mentions(temp_channel_id, `New comment on issue: ${issue_title}`, comment_body, issue_url, comment_creator, creator_avatar_url, comment_create_date);

      }
    }
  
    catch (error) {
      console.error(error);
    }
    res.send('Webhook initial test was received');



});


(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();


/* The @ symbol for mentions is not concated here because the convention for mentioning is different 
between mentioning users/groups/channels. To mention the channel, say when a closed issue is commented
on, the special convention is <!channel>. */
function githubBlock(title, body, url, creator, avatar_url, date, mentioned_slack_user) {

  return [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `*<${mentioned_slack_user}>*`
      }
    },
    
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `*${title}*`
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "accessory": {
        "type": "image",
        "image_url": avatar_url,
        "alt_text": `${creator}'s GitHub avatar`
      },
      "text": {
        "type": "plain_text",
        "text": body,
        "emoji": true
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Visit issue page",
            "emoji": true
          },
          "url": url,
          "action_id": "link_button"
        }
      ]
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "plain_text",
          "text": `Date: ${date}`,
          "emoji": true
        }
      ]
    }
]
}


function map_ghusername_to_slack_message(slackusername, githubusername) {

  let block_message = "if that looks right, press the button. If not, check that you followed the format above and retry.";


  // The button_block is a variable so that it won't be rendered if the username is undefined!
  let button_block = 	{

    "type": "actions",
    "elements": [
      {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "Map usernames",
          "emoji": true
        },
        "action_id": "connect_account",
        "value": githubusername
      }
    ]
  };
  
  if (githubusername === undefined) {
    block_message = "You forgot to give me a username silly! Make sure you follow the format described above!"
    button_block = {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "The correct format is: \n \n `@gitwave <your github username>`"
      }
    }
  }
  

  return [
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": `Hi <@${slackusername}>! :wave:`
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "Make sure you spelled your GitHub username correctly. The correct format is: \n \n `@gitwave <your github username>`"
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": `Your GitHub username is *${githubusername}*. ${block_message}`
			}
		},
    button_block
	]
}
  

// TODO: Get user's timezone and display the date/time with respect to it

function mention_message(channel_id, title, body, url, creator, avatar_url, create_date, mentioned_slack_user, is_special_mention) {
  app.client.chat.postMessage({
    // Since there is no context we just use the original token
    token: process.env.SLACK_BOT_TOKEN,
    // Conditional on whether the message should go to channel or just to a user as a DM
    ...(is_special_mention && { channel: channel_id, 
                                blocks: githubBlock(title, body, url, creator, avatar_url, create_date, mentioned_slack_user) 
                              }),

    ...(!is_special_mention && { channel: mentioned_slack_user,
                                 blocks: githubBlock(title, body, url, creator, avatar_url, create_date, `@${mentioned_slack_user}`) 
                               }),
    text: `<@${mentioned_slack_user}>! ${title} posted by ${creator} on ${create_date}. Link: ${url}`
  });
} 


// TODO: Function that lets user see all the username mappings with a slash command
function view_username_mappings (username_mappings) {
  console.log(username_mappings)
}


// Function that checks for github username mentions in a body of text
function check_for_mentions(temp_channel_id, title, text_body, content_url,content_creator, creator_avatar_url, content_create_date) {

  /* Since the regex contains a global operator, matchAll can used to get all the matches & the groups as an iterable.
  In this first version, we don't need to use substring(1) to drop the @ since contains_mention would also have just the usernames. */

  const contains_mention = text_body.match(/\B@([a-z0-9](?:-?[a-z0-9]){0,38})/gi);

  // Checks to see if the body mentions a username
  if (contains_mention) {
    contains_mention.forEach(mentioned_username => {

      let github_username = mentioned_username.substring(1);
      
      console.log(`mentioned gh username: ${github_username}`);

      let mentioned_slack_user = gh_slack_username_map[github_username];

      console.log(`mentioned slack user: ${mentioned_slack_user}`);

      // If the mentioned usernmae is associated with a Slack username, mention that person
      // TODO: DM the person rather than posting the message to the channel
      if (mentioned_slack_user) {
        mention_message(temp_channel_id, title, text_body, content_url, content_creator, creator_avatar_url, content_create_date, mentioned_slack_user, false)     
      }
    });
  }
  
}