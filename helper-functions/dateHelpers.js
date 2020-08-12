/**
 * Returns one week after the given date, or one week after the current date if no
 * parameters are passed
 *
 * @param {Date} [date] Default is `new Date()`
 * @returns {Date} The week after the given/current date
 */
function nextWeek(date = new Date()) {
  return new Date(date.getTime() + 604800000); // milliseconds in a week
}
/**
 * Returns the Date input in the format: "Friday, August 14 (8/14)"
 *
 * @param {Date} date
 * @returns {String} The formatting Date string
 */
function dateFormatter(date) {
  const optionsLong = {weekday: 'long', month: 'long', day: 'numeric'};
  const optionsShort = {day: 'numeric', month: 'numeric'};
  return `${date.toLocaleDateString('en-US', optionsLong)} (${date.toLocaleDateString(
    'en-US',
    optionsShort
  )})`;
}

exports.nextWeek = nextWeek;
exports.dateFormatter = dateFormatter;
