module.exports = {
  "root": true,
  "overrides": [
    {
      "files": ["*.ts", "*.tsx"],
      "extends": [
        "airbnb-typescript/base"
      ],
      "parser": "@typescript-eslint/parser",
      "env": {
        "es6": true
      },
      "plugins": ["@typescript-eslint"],
      "parserOptions": {
        "project": "./api/tsconfig.json"
      }
    },
    {
      "files": ["*.vue", "*.js"],
      "extends": [
        "plugin:vue/essential",
        "eslint:recommended"
      ],
      "env": {
        "node": true
      },
      "rules": {},
      "parser": "vue-eslint-parser",
      "parserOptions": {
        "parser": "babel-eslint"
      }
    }
  ]
};
