const path = require('path');

module.exports = {
  extends: [
    'airbnb-typescript/base',
  ],
  env: {
    es6: true,
  },
  parserOptions: {
    project: path.join(__dirname, 'tsconfig.json'),
  },
};
