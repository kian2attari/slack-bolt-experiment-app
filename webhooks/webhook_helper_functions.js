const {reg_exp} = require('../constants');
/**
 * Searches an array of labels and returns the count of triage labels
 *
 * @param {Array} labels
 * @returns {number}
 */
function triage_label_count(labels) {
  const triage_labels = labels.filter(label =>
    reg_exp.find_triage_labels(label.description)
  );

  return triage_labels.length;
}

exports.triage_label_count = triage_label_count;
