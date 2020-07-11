module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parser: 'babel-eslint',
  extends: ['airbnb-base', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 11,
  },
  rules: {
    'global-require': 'off',
    'camelcase': 'off',
    'no-use-before-define': ['error', {'functions': false}],
  },
};
