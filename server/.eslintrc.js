module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['import'],
  extends: ['airbnb-base', 'plugin:@typescript-eslint/recommended', 'prettier', 'prettier/@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/no-use-before-define': ['error', { functions: false, classes: false }],
    '@typescript-eslint/camelcase': 0,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/explicit-member-accessibility': 0,
    '@typescript-eslint/prefer-interface': 0,
    '@typescript-eslint/no-unused-vars': 0,
    'import/prefer-default-export': 0,
    'no-console': 0,
    'max-classes-per-file': 0,
    'class-methods-use-this': 0,
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts'],
    },
    'import/resolver': {
      typescript: {},
    },
  },
};
