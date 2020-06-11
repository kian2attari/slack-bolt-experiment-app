const { App, ExpressReceiver } = require('@slack/bolt');
const express  = require('express');


// Create a Bolt Receiver
const expressReceiver = new ExpressReceiver({ signingSecret: process.env.SLACK_SIGNING_SECRET });

// Initializes your app with your bot token, signing secret, and receiver
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: expressReceiver
});


// Listens to incoming messages that contain 'yo bot'
app.message('yo bot', async ({ message, say}) => {

// note: say() send a message to the channel where the event was triggered

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

app.action('button_click', async ({body, ack, say}) => {
  
  // Here we acknowledge receipt

  await ack();

  await say(`<@${body.user.id}>, thanks for clicking my button bro. That's respect :100:`);
});




// Parsing JSON Middleware?
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
        contains_mention.forEach(username => {
          mention_message('C015FH00GVA', issue_title, issue_body, issue_url, issue_creator, creator_avatar_url, issue_create_date)     
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
function githubBlock(title, body, url, creator, avatar_url, date) {

  return [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `*@person!*`
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
  


function mention_message(channel_id, title, body, url, creator, avatar_url, create_date) {
  app.client.chat.postMessage({
    // Since there is no context we just use the original token
    token: process.env.SLACK_BOT_TOKEN,
    // The channel is currently hardcoded
    channel: channel_id,
    blocks: githubBlock(title, body, url, creator, avatar_url, create_date),
    text: `${title} posted by ${creator} on ${create_date}. Link: ${url}`
  });

} 


