const { App, ExpressReceiver } = require('@slack/bolt');
const express  = require('express');


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
const temp_channel_id = 'C015FH00GVA';




/* Portion of app that listens for events */


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




/* Portion of app that listens for actions (notably, button clicks) */


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



// Parsing JSON Middleware
expressReceiver.router.use(express.json())

// Receive github webhooks here!
expressReceiver.router.post('/webhook', (req, res) => {

  try {
      let issue_body = req.body.issue.body;
      let issue_url = req.body.issue.html_url;
      let issue_title = req.body.issue.title;
      let issue_creator = req.body.issue.user.login;
      let creator_avatar_url = req.body.issue.user.avatar_url;
      let issue_create_date = new Date(req.body.issue.created_at);

      /* There two ways of matching the GitHub usernames and storing them in the mapping. 
      The regular expression is matching @github username.  */

      /* Since the regex contains a global operator, matchAll can used to get all the matches & the groups as an iterable.
      In this first version, we don't need to use shift() to drop the @ since contains_mention would also have just the usernames. */
      // const contains_mention = [... issue_body.matchAll(/\B@([a-z0-9](?:-?[a-z0-9]){0,38})/gi)];

      /* This version only matches to all the mentions, so rather than just get the GH username, contains_mention elements are of form @username 
      so we need to drop the @ */
      const contains_mention = issue_body.match(/\B@([a-z0-9](?:-?[a-z0-9]){0,38})/gi);

      // Checks to see if the body mentions a username
      if (contains_mention) {
        contains_mention.forEach(mentioned_username => {

          mentioned_username.shift();
          
          console.log(`mentioned gh username: ${mentioned_username}`);

          let mentioned_slack_user = gh_slack_username_map[mentioned_username];

          console.log(`mentioned slack user: ${mentioned_slack_user}`);

          // If the mentioned usernmae is associated with a Slack username, mention that perosn
          if (mentioned_slack_user) {
            mention_message(temp_channel_id, issue_title, issue_body, issue_url, issue_creator, creator_avatar_url, issue_create_date, mentioned_username, mentioned_slack_user)     
          }
        });
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


// TODO: Once the Slack and GitHub usernames database is made, remove the @person hardcoding
function githubBlock(title, body, url, creator, avatar_url, date, mentioned_username, mentioned_slack_user) {

  return [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `*<@${mentioned_slack_user}>*`
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
          "action_id" : "button_link"
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
        "text": "The correct format is: \n \n `@githelper <your github username>`"
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
				"text": "Make sure you spelled your GitHub username correctly. The correct format is: \n \n `@githelper <your github username>`"
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
  


function mention_message(channel_id, title, body, url, creator, avatar_url, create_date, mentioned_username, mentioned_slack_user) {
  app.client.chat.postMessage({
    // Since there is no context we just use the original token
    token: process.env.SLACK_BOT_TOKEN,
    // The channel is currently hardcoded
    channel: channel_id,
    blocks: githubBlock(title, body, url, creator, avatar_url, create_date, mentioned_username, mentioned_slack_user),
    text: `<@${mentioned_slack_user}>! ${title} posted by ${creator} on ${create_date}. Link: ${url}`
  });
} 


// TODO: Function that lets user see all the username mappings with a slash command


