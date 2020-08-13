/**
 * Randomly shuffles the given array input. Useful for assigning substitutes for triage duty
 * in order to prevent the same people from always being picked first
 *
 * @param {Array} array
 * @returns {Array} A shuffled version of the array input
 */
function shuffleArray(array) {
  const shuffledArray = array;
  for (let i = shuffledArray.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}

exports.shuffleArray = shuffleArray;
