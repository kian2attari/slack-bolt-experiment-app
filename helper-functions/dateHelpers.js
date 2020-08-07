/**
 * Returns one week after the given date, or one week after the current date if no
 * parameters are passed
 *
 * @param {Date} [date] Default is `new Date()`
 * @returns {Date} The week after the given/current date
 */
function next_week(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7);
}
/**
 * Returns the Date input in the format: "Friday, August 14 (8/14)"
 *
 * @param {Date} date
 * @returns {String} The formatting Date string
 */
function date_formatter(date) {
  const options_long = {weekday: 'long', month: 'long', day: 'numeric'};
  const options_short = {day: 'numeric', month: 'numeric'};
  return `${date.toLocaleDateString('en-US', options_long)} (${date.toLocaleDateString(
    'en-US',
    options_short
  )})`;
}

exports.next_week = next_week;
exports.date_formatter = date_formatter;
