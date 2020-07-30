module.exports = {
  outputDir: 'build',
  runtimeCompiler: process.env.NODE_ENV === 'development',
  transpileDependencies: [
    'yjs',
    'lib0',
    'quill-image-drop-module',
    'isomorphic.js',
    'vue-native-websocket',
  ],
}
