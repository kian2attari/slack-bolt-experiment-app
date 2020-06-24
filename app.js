const { App, ExpressReceiver } = require('@slack/bolt');
const express  = require('express');
const { query, mutation, graphql } = require('./graphql')
const { AppHomeBase, AppHomeMoreInfoSection, 
        AppHomeMoreInfoIssueModal, AppHomeIssue,
        SetupShortcutModal } = require('./blocks')


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


const variables_getFirstColumnInProject = Object.assign({ project_name: "Slack dummy-test"}, gh_variables_init);


const variables_get_untriaged_label_id = Object.assign({label_name: "untriaged"}, gh_variables_init)

// TODO Possible remove the hardcoding on this
const untriaged_label_name = 'untriaged'


let repo_label_list;

// The block that contains the possible label values
let label_block = [];

let untriaged_label_id;

// Get list of all the labels in the repo
graphql.call_gh_graphql(query.getRepoLabelsList, gh_variables_init, gh_variables_init).then((response) => {
  repo_label_list = response.repository.labels.nodes
  untriaged_label_id = repo_label_list.find(label => label.name == untriaged_label_name).id

  // Create a block that contains a section for each label
  repo_label_list.forEach((label) => {
    label_block.push({
      "text": {
        "type": "plain_text",
        "text": label.name
      },
      "value": {"l_id": label.id }
    });
  })
})




let untriaged_column_id = "";

// TODO: Add cards automatically to Needs Triage when they are labelled with the unlabelled tag
graphql.call_gh_graphql(query.getFirstColumnInProject, variables_getFirstColumnInProject, gh_variables_init).then((response) => {
  untriaged_column_id = response.repository.projects.nodes[0].columns.nodes[0].id;
});





/* -------------------------------------------------------------------------- */
/*                    SECTION Listening for events/options/actions            */
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



//!SECTION



/* ----------------------- SECTION Listening for events ---------------------- */

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

//!SECTION

/* -------------------------- SECTION App Home View events -------------------------- */

// Loads the app home when the app home is opened!

app.event('app_home_opened', async ({ event, context, client }) => {
  try {
    console.log(event); 
    console.log(AppHomeBase())
    /* view.publish is the method that your app uses to push a view to the Home tab */
    const result = await client.views.publish({

      /* retrieves your xoxb token from context */
      token: context.botToken,

      /* the user that opened your app's app home */
      user_id: event.user,

      /* the view payload that appears in the app home*/
      view: AppHomeBase()
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

//!SECTION

/* ------------- SECTION Portion of app that listens for actions ------------ */

// Responds to the test button
app.action('test_click', async ({body, ack, say}) => {
  
  // Here we acknowledge receipt
  await ack();

  await say(`<@${body.user.id}>, thanks for clicking my button bro. That's respect :100:`);
});

// Responds to the Map usernames button 
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


// Responds to the 'See number of cards by column' button on the home page
app.action('column_card_count_info', async ({ ack, body, context, client}) => {

  // Here we acknowledge receipt
  await ack();

  const trigger_id = body.trigger_id
  const project_number = parseInt(body.actions[0].value);
  const variables_getCardsByProjColumn = Object.assign({ project_number: project_number }, gh_variables_init);
  const num_cards_per_column = await graphql.call_gh_graphql(query.getNumOfCardsPerColumn, variables_getCardsByProjColumn)
  
  const project_name = num_cards_per_column.repository.project.name
  
  const array_column_info = num_cards_per_column.repository.project.columns.nodes


  const result = await client.views.open({

    /* retrieves your xoxb token from context */
    token: context.botToken,

    trigger_id: trigger_id,

    /* the view payload that appears in the app home*/
    view:  AppHomeMoreInfoIssueModal(array_column_info, project_name)
  });
  
})

// Acknowledges button clicks
// TODO: Possibly change the Bolt library so that link buttons don't have to be responded to
app.action('link_button', ({ ack }) => ack());


/* ------------- ANCHOR Responding to the project name selection ------------ */

app.action('project_list', async ({ ack, body, context, client }) => {
  await ack();

  try {

    const action_body = body.actions[0]

    const selected_option = action_body.selected_option

    const project_number = selected_option.value

    const variables_getCardsByProjColumn = Object.assign({ project_number: parseInt(project_number) }, gh_variables_init);


    const issue_response = await graphql.call_gh_graphql(query.getCardsByProjColumn, variables_getCardsByProjColumn)


    // The actually array of issues extracted from the graphQL query
    const issue_array =  issue_response.repository.project.columns.nodes[0].cards.nodes

    console.log(issue_array)

    const column_id = issue_response.repository.project.columns.nodes[0].id
    
    console.log(column_id)

    /* The blocks that should be rendered as the Home Page. The new page is 
    based on the AppHomeBase but with the issue_blocks and more_info_blocks added to it! */
    const home_view = AppHomeBase(issue_blocks = AppHomeIssue(issue_array, label_block),
                                  more_info_blocks = AppHomeMoreInfoSection(project_number), 
                                  initial_option = selected_option)
    console.log(JSON.stringify(home_view.blocks, null, 4))

    /* view.publish is the method that your app uses to push a view to the Home tab */
    const result = await client.views.update({

      /* retrieves your xoxb token from context */
      token: context.botToken,

      /* View to be updated */
      view_id: body.view.id,

      /* the view payload that appears in the app home*/
      view: home_view
    });


  }
  catch (error) {
    console.error(error);
  }
  
});

/* ------------- ANCHOR Responding to label assignment on issue ------------- */

/* ------ TODO - add a clear all labels button ----- */

app.action('label_list', async ({ ack, body, context, client }) => {
  await ack();

  try {
    console.log("body payload")

    const action_body = body.actions[0]

    console.log(action_body)

    const selected_id_label_value = action_body.selected_options.map((option) => {return JSON.parse(option.value)})

    const no_label_selected = selected_id_label_value.length == 0 ? true : false

    let issue_id;

    
    if (no_label_selected) {
      const initial_id_label_value = action_body.initial_options.map((option) => {return JSON.parse(option.value)})
      issue_id = initial_id_label_value[0].iss_id
    }

    else {
      // The issue ID is the same across the labels, so we just grab it from the first one
      issue_id = selected_id_label_value[0].iss_id
    }
  

    const variables_clearAllLabels = {
      element_node_id: issue_id
    }

    // We await the clearing so that the new labels, if any, are added after clearing
    await graphql.call_gh_graphql(mutation.clearAllLabels, variables_clearAllLabels);

    // The GraphQL API needs an array of label IDs, so we extract just that
    const label_ids_array = selected_id_label_value.map(label_obj => label_obj.l_id)

    const variables_addLabelToIssue = Object.assign({ label_ids: label_ids_array }, variables_clearAllLabels) 

    // Only call the addLabelToIssue mutation if the user selected a label
    if (!no_label_selected) graphql.call_gh_graphql(mutation.addLabelToIssue, variables_addLabelToIssue, gh_variables_init);


  }
  catch (error) {
    console.error(error)
  }
  
});

//!SECTION

/* ----------------------- SECTION Listen for options ----------------------- */

// Responding to a project_list options request with a list of projects
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

// !SECTION

/* ------------------------ REVIEW Labels as options ------------------------ */

// Responding to a label_list options request with a list of labels
// app.options('label_list', async ({ options, ack }) => {
//   try {
//     // Get information specific to a team or channel
//       let options_response = [];

//       // Collect information in options array to send in Slack ack response
//       repo_label_list.forEach((label) => {
//         options_response.push({
//           "text": {
//             "type": "plain_text",
//             "text": label.name
//           },
//           "value": label.id
//         });
//       })

//       await ack({
//         "options": options_response
//       });


//   }
//   catch(error) {
//     console.error(error)
//   }
// });


/* -------------------------------------------------------------------------- */
/*                       SECTION Listening for shortcuts                       */
/* -------------------------------------------------------------------------- */

app.shortcut('setup_triage_workflow', async ({ shortcut, ack, context, client }) => {

  try {
    // Acknowledge shortcut request
    await ack();

    // Call the views.open method using one of the built-in WebClients
    const result = await client.views.open({
      // The token you used to initialize your app is stored in the `context` object
      token: context.botToken,
      trigger_id: shortcut.trigger_id,
      view: SetupShortcutModal()
    });

    console.log(result);
  }
  catch (error) {
    console.error(error);
  }
});




// !SECTION Listening for shortcuts



// !SECTION Listening for events/options/actions

/* -------------------------------------------------------------------------- */
/*                     SECTION Where webhooks are received                    */
/* -------------------------------------------------------------------------- */


// Parsing JSON Middleware
expressReceiver.router.use(express.json())

// Receive github webhooks here!
expressReceiver.router.post('/webhook', (req, res) => {

  if (req.headers['content-type'] !== 'application/json') {
    return res.send('Send webhook as application/json');
  }

/* -------- TODO organize this to use swtich cases or modular design -------- */

  try {
      const request = req.body;
      const action = request.action;

      // TODO: Handle other event types. Currently, it's just issue-related events
      if (req.headers['x-github-event'] == 'issues' ) {
        const issue_url = request.issue.html_url;
        const issue_title = request.issue.title;  
        const issue_body = request.issue.body;
        const issue_creator = request.issue.user.login;
        const creator_avatar_url = request.issue.user.avatar_url;
        const issue_create_date = new Date(request.issue.created_at);
        const issue_node_id = request.issue.node_id;
        
        // QUESTION: Should editing the issue also cause the untriaged label to be added?
        if (action == "opened" || action == "reopened") {

          const variables_addLabelToIssue = {
            element_node_id: issue_node_id,
            label_ids: [untriaged_label_id]
          }

          graphql.call_gh_graphql(mutation.addLabelToIssue, variables_addLabelToIssue, gh_variables_init);

          check_for_mentions(temp_channel_id, issue_title, issue_body, issue_url, issue_creator, creator_avatar_url, issue_create_date);
        }

/* ---- ANCHOR What to do  there is a label added or removed from an issue ---- */

        else if (action == "labeled") {
          // const issue_label_array = request.issue.labels;

          const label_id = request.label.node_id
          console.log(label_id)
          console.log(untriaged_label_id)
          if (label_id == untriaged_label_id) {
            const addCardToColumn_variables = {"issue": {"projectColumnId" : untriaged_column_id, "contentId": issue_node_id}}
            graphql.call_gh_graphql(mutation.addCardToColumn, addCardToColumn_variables)
          }

/* --------- TODO add a project card when issue is labeled untriaged -------- */

        }

        else if (action == "unlabeled") {

/* -- TODO remove project from new issue column if untriaged label removed -- */

        }
      
        
      }

      else if (req.headers['x-github-event'] == 'issue_comment') {
        let issue_url = request.issue.html_url;
        let issue_title = request.issue.title;  
        let comment_body = request.comment.body;
        let comment_creator = request.comment.user.login;
        let creator_avatar_url = request.comment.user.avatar_url;
        let comment_create_date = new Date(request.comment.created_at);

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

//!SECTION

/* -------------------------------------------------------------------------- */
/*                          SECTION Where app starts                          */
/* -------------------------------------------------------------------------- */


(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();

// !SECTION

/* -------------------------------------------------------------------------- */
/*                        SECTION Function definitions                        */
/* -------------------------------------------------------------------------- */


/* The @ symbol for mentions is not concatenated here because the convention for mentioning is different 
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

      // If the mentioned username is associated with a Slack username, mention that person
      // TODO: DM the person rather than posting the message to the channel
      if (mentioned_slack_user) {
        mention_message(temp_channel_id, title, text_body, content_url, content_creator, creator_avatar_url, content_create_date, mentioned_slack_user, false)     
      }
    });
  }
  
}

//!SECTION