module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  extends: [
    'plugin:react/recommended',
    'airbnb-typescript-prettier',
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'prettier/@typescript-eslint', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  parserOptions: {
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
    ecmaFeatures: {
      jsx: true,
    },
    project: "./tsconfig.json"
  },
  env: {
    es6: true,
    browser: true,
    node: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      'webpack': {
        "config": 'webpack.config.dev.ts'
      }
    },
  },
  rules: {
    'react/prop-types': ['error', {skipUndeclared: true}],
    'react/display-name': 0,
    'react/jsx-no-target-blank': 0,
    'react/jsx-props-no-spreading': 0,

    'import/no-named-as-default': 0,
    'import/prefer-default-export': 0,

    '@typescript-eslint/explicit-function-return-type': 0,

    'no-shadow': 0,
  },
  ignorePatterns: ['node_modules/', 'build/', 'lib/'],
};
