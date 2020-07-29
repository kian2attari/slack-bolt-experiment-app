const {triage_reactjis} = require('../../constants');
const {update_document} = require('../../db');
const {reg_exp} = require('../../constants');

// Listener middleware that filters out reactions that we dont care about
async function triage_reactions_middleware({event, next}) {
  if (triage_reactjis.includes(event.reaction)) {
    console.log('reaction', event.reaction);
    await next();
  }
}

function reaction_added(app) {
  app.event('reaction_added', triage_reactions_middleware, async ({event}) => {
    console.log('reaction added event', event);
    try {
      const {
        user,
        reaction,
        event_ts,
        item: {channel, ts: issue_message_ts},
      } = event;

      const issue_triage_data = {
        acting_team_member_user_id: user,
        reaction_last_update_ts: event_ts,
        status: 'untriaged',
      };

      switch (reaction) {
        case 'eyes':
          issue_triage_data.status = 'seen';
          break;
        case 'white_check_mark':
          issue_triage_data.status = 'done';
          break;
        // no default
      }

      console.log('issue_triage_data', issue_triage_data);

      const team_query_filter = {
        team_internal_triage_channel_id: channel,
      };

      const fixed_format_ts = issue_message_ts.replace(reg_exp.find_all_dots, '_');

      const update_issue_obj = {};

      const update_issue_obj_property = `internal_triage_items.${fixed_format_ts}.issue_triage_data`;

      update_issue_obj[update_issue_obj_property] = issue_triage_data;

      console.log('update issue obj', update_issue_obj);

      const response = await update_document(team_query_filter, update_issue_obj);

      console.log('success response', response);
    } catch (error) {
      console.error(error);
    }
  });
}

exports.reaction_added = reaction_added;
