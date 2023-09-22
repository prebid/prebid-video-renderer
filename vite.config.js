import { resolve } from 'path'

export default {
  build: {
    target: 'es2015',
    lib: {
      entry: resolve(__dirname, 'src/main.js'),
      name: 'Prebid Video Renderer',
      fileName: 'prebid-video-renderer',
    }
  }
}
