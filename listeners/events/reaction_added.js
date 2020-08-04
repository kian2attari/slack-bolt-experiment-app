const {triage_reacjis} = require('../../constants');
const {update_internal_triage_status_in_db} = require('../commonFunctions');

// Listener middleware that filters out reactions that we dont care about
async function triage_reactions_middleware({event, next}) {
  if (triage_reacjis.includes(event.reaction)) {
    console.log('reaction', event.reaction);
    await next();
  }
}

function reaction_added(app) {
  app.event('reaction_added', triage_reactions_middleware, async ({event}) => {
    console.log('reaction added event', event);
    const {user, reaction, event_ts, item} = event;
    try {
      await update_internal_triage_status_in_db({
        user,
        reaction,
        event_ts,
        channel: item.channel,
        issue_message_ts: item.ts,
      });
    } catch (error) {
      console.error(error);
    }
  });
}

exports.reaction_added = reaction_added;
