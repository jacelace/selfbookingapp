const postcssNested = require('postcss-nested');

module.exports = {
  plugins: [
    postcssNested({}),
    require('tailwindcss'),
    require('autoprefixer')
  ]
}
