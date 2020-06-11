const { App, ExpressReceiver } = require('@slack/bolt');
const express  = require('express');


// Create a Bolt Receiver
const expressReceiver = new ExpressReceiver({ signingSecret: process.env.SLACK_SIGNING_SECRET });

// Initializes your app with your bot token, signing secret, and receiver
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: expressReceiver
});

let gh_slack_username_map =
{};

const temp_channel_id = 'C015FH00GVA';


// Listens to incoming messages that contain 'yo bot'
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
          "action_id": "button_click"
        }
      }
    ]
  });
});

app.event('app_mention', async ({ event, context }) => {
  try {

    // The first word is the mention, the second should be the username
    let github_username = event.text.split(" ")[1];

    const result = await app.client.chat.postMessage({
      token: context.botToken,
      channel: temp_channel_id,
      blocks: map_ghusername_to_slack_message(event.user.id,github_username),
      text: `Hey there <@${event.user.id}>! Please make sure that GitHub username is right!`
    });
    console.log(result);
  }
  catch (error) {
    console.error(error);
  }
});


app.action('button_click', async ({body, ack, say}) => {
  
  // Here we acknowledge receipt

  await ack();

  await say(`<@${body.user.id}>, thanks for clicking my button bro. That's respect :100:`);
});

app.action('connect_account', async ({body, ack, say}) => {
  
  // Here we acknowledge receipt

  await ack();

  gh_slack_username_map[body.user.id] = body.actions.value;

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

      const contains_mention = issue_body.match(/\B@([a-z0-9](?:-?[a-z0-9]){0,38})/gi);

      // Checks to see if the body mentions a username
      if (contains_mention) {
        contains_mention.forEach(mentioned_username => {
          mention_message(temp_channel_id, issue_title, issue_body, issue_url, issue_creator, creator_avatar_url, issue_create_date, mentioned_username)     
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
function githubBlock(title, body, url, creator, avatar_url, date, mentioned_username) {

  return [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `*${mentioned_username}!*`
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
  return [
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": `Hi @${slackusername}! :wave:`
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
				"text": `I think you GitHub username is *${githubusername}*, if that's correct, press the button. If not, check that you followed the format above and retry`
			}
		},
		{
			"type": "actions",
			"elements": [
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"text": "Connect account",
						"emoji": true
					},
          "action_id": "connect_account",
          "value": githubusername
				}
			]
		}
	]
}
  


function mention_message(channel_id, title, body, url, creator, avatar_url, create_date, mentioned_username) {
  app.client.chat.postMessage({
    // Since there is no context we just use the original token
    token: process.env.SLACK_BOT_TOKEN,
    // The channel is currently hardcoded
    channel: channel_id,
    blocks: githubBlock(title, body, url, creator, avatar_url, create_date, mentioned_username),
    text: `${title} posted by ${creator} on ${create_date}. Link: ${url}`
  });

} 


