const {camelCaseWithFixer} = require('./rules/camelCaseWithFixer');
const {
  noUndefSnakeCaseToCamelCaseFixer,
} = require('./rules/noUndefSnakeCaseToCamelCaseFixer');

exports.rules = {camelCaseWithFixer, noUndefSnakeCaseToCamelCaseFixer};
