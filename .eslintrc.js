module.exports = {
  env: {
    node: true,
  },
  parser: 'babel-eslint',
  extends: ['airbnb-base', 'plugin:prettier/recommended', 'plugin:markdown/recommended'],
  parserOptions: {
    ecmaVersion: 11,
  },
  plugins: ['node', 'markdown'],
  overrides: [
    {
      // 2. Enable the Markdown processor for all .md files.
      files: ['**/*.md', '**/*.markdown'],
      processor: 'markdown/markdown',
    },
    // {
    //   // 3. Optionally, customize the configuration ESLint uses for ```js
    //   // fenced code blocks inside .md files.
    //   files: ['**/*.md/*.js'],
    //   // ...
    //   rules: {
    //     // ...
    //   },
    // },
  ],
  rules: {
    'global-require': 'off',
    'no-use-before-define': ['error', {'functions': false}],
    'no-console': 'off',
    // Modified no-restricted-syntax to remove the restriction on ForOf statements.
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message:
          'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message:
          'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message:
          '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    // 'node/exports-style': ['error', 'exports'],
  },
};
