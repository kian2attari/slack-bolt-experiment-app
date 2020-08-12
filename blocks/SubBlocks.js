/**
 * Returns an object for the options: or initial_option: property of a select_menu
 *
 * @param {string} optionText
 * @param {string} [optionVal] Default is `optionText`
 * @returns {object} An option object
 */
function optionObj(optionText, optionVal = optionText) {
  return {
    'text': {
      'type': 'plain_text',
      'text': optionText,
      'emoji': true,
    },
    'value': optionVal,
  };
}

exports.optionObj = optionObj;
