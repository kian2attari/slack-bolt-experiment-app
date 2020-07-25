const {triage_reactjis} = require('../../constants');
const {update_issue_triage_status} = require('../../db');

// Listener middleware that filters out reactions that we dont care about
async function triage_reactions_middleware({event, next}) {
  if (triage_reactjis.includes(event.reaction)) {
    console.log('reaction', event.reaction);
    await next();
  }
}

function reaction_added(app) {
  app.event('reaction_added', triage_reactions_middleware, async ({event}) => {
    try {
      const {
        user,
        reaction,
        event_ts,
        item: {channel, ts: issue_message_ts},
      } = event;

      const db_issue_update_vars = {
        internal_triage_channel_id: channel,
        internal_triage_item: {
          issue_message_ts,
          issue_triage_data: {
            acting_team_member_user_id: user,
            reaction_last_update_ts: event_ts,
            status: 'untriaged',
          },
        },
      };

      switch (reaction) {
        case 'eyes':
          db_issue_update_vars.internal_triage_item.issue_triage_data.status = 'seen';
          break;
        case 'white_check_mark':
          db_issue_update_vars.internal_triage_item.issue_triage_data.status = 'done';
          break;
        // no default
      }

      console.log('db_issue_update_vars', db_issue_update_vars);

      // TODO update DB
      update_issue_triage_status(db_issue_update_vars);
    } catch (error) {
      console.error(error);
    }
  });
}

exports.reaction_added = reaction_added;
