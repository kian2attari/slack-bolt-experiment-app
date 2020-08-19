const {triageReacjis} = require('../../constants');
const {updateInternalTriageStatusInDb} = require('../commonFunctions');

// Listener middleware that filters out reactions that we dont care about
async function triageReactionsMiddleware({event, next}) {
  if (triageReacjis.includes(event.reaction)) {
    console.log('reaction', event.reaction);
    await next();
  }
}

function reactionAdded(app) {
  app.event('reaction_added', triageReactionsMiddleware, async ({event}) => {
    console.log('reaction added event', event);
    const {user, reaction, eventTs, item} = event;
    try {
      await updateInternalTriageStatusInDb({
        user,
        reaction,
        event_ts: eventTs,
        channel: item.channel,
        issueMessageTs: item.ts,
      });
    } catch (error) {
      console.error(error);
    }
  });
}

exports.reactionAdded = reactionAdded;
