module.exports = {
  extends: [
    'react-app',
  ],
  plugins: [
    'react',
  ],
  env: {
    browser: true,
  },
  rules: {
    'import/prefer-default-export': 'off',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: './api/tsconfig.json',
      },
      plugins: ['@typescript-eslint'],
      extends: ['airbnb-typescript'],
      rules: {
        '@typescript-eslint/camelcase': 'off',
        'import/prefer-default-export': 'off',
      },
    },
  ],
};
