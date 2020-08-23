module.exports = {
  "root": true,

  overrides: [
    {
      files: [
        '*.ts',
        '*.tsx'
      ],
      'extends': [
        'airbnb-typescript/base'
      ],
      parser: '@typescript-eslint/parser',
      env: {
        es6: true
      },
      plugins: [
        '@typescript-eslint'
      ],
      rules: {
        "no-underscore-dangle": ["error", {
          "allow": ["_id"]
        }],
        "no-param-reassign": [
          2, { "props": false }
        ],
        "class-methods-use-this": 'off',
        "no-plusplus": 'off'
      },
      parserOptions: {
        project: './api/tsconfig.json'
      }
    },
    {
      files: [
        '*.vue',
        '*.js'
      ],
      'extends': [
        'plugin:vue/essential',
        'eslint:recommended'
      ],
      env: {
        node: true
      },
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: 'babel-eslint'
      }
    },
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      env: {
        mocha: true
      }
    }
  ]
};
