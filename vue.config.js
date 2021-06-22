module.exports = {
  outputDir: 'build',
  css: {
    sourceMap: true,
  },

  transpileDependencies: [
    'yjs',
    'lib0',
    'isomorphic.js',
    'vue-native-websocket',
    'y-prosemirror',
    'highlight.js',
    'bootstrap-vue',
  ],

  chainWebpack: config => {
    config.module
      .rule('svg-sprite')
      .use('svgo-loader')
      .loader('svgo-loader')

    config.resolve.alias.set('bootstrap-vue$', 'bootstrap-vue/src/index.js')
  },

  pluginOptions: {
    svgSprite: {
      /*
       * The directory containing your SVG files.
       */
      dir: 'src/images/icons',
      /*
       * The reqex that will be used for the Webpack rule.
       */
      test: /\.(svg)(\?.*)?$/,
      /*
       * @see https://github.com/kisenka/svg-sprite-loader#configuration
       */
      loaderOptions: {
        extract: true,
        spriteFilename: 'img/icons.[hash:8].svg' // or 'img/icons.svg' if filenameHashing == false
      },
      /*
       * @see https://github.com/kisenka/svg-sprite-loader#configuration
       */
      pluginOptions: {
        plainSprite: true
      }
    }
  }
}
