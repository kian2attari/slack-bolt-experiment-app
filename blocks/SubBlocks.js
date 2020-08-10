/**
 * Returns an object for the options: or initial_option: property of a select_menu
 *
 * @param {string} option_text
 * @param {string} [option_val] Default is `option_text`
 * @returns {object} An option object
 */
function option_obj(option_text, option_val = option_text) {
  return {
    'text': {
      'type': 'plain_text',
      'text': option_text,
      'emoji': true,
    },
    'value': option_val,
  };
}

exports.option_obj = option_obj;
