module.exports = {
  outputDir: 'build',
  pages: {
    index: {
      entry: 'src/main.js',
      template: 'src/index.html',
      filename: 'index.html',
      title: 'BeeJee',
      chunks: ['chunk-vendors', 'chunk-common', 'index']
    }
  },
  runtimeCompiler: process.env.NODE_ENV === 'development',
}
