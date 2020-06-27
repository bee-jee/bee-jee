const tailwindcss = require('tailwindcss');
module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-preset-env')({
      stage: 1,
    }),
    require('postcss-nested'),
    tailwindcss('./tailwind.js'),
    require('autoprefixer'),
  ],
};
