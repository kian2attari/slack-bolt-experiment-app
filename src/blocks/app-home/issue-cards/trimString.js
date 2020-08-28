/**
 * Takes in a string and a length limit and cuts that string down with ellipses at the end
 * if it crosses that limit
 *
 * @param {string} string
 * @param {number} length
 * @returns {string} The string, possibly cut short with ellipses at the end
 */
function trimString(string, length) {
  return string.length > length ? `${string.substring(0, length)}...` : string;
}

exports.trimString = trimString;
