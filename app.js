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
  // You're working with an express req and res now.
  var github_event_issue_body = req.body;

  console.log(github_event_issue_body);

  res.send('Webhook received successfully yeehaw');
});


(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();






