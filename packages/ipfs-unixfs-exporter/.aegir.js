'use strict'

/** @type {import('aegir').Options["build"]["config"]} */
const buildConfig = {
  plugins: [
    {
      name: 'node built ins',
      setup (build) {
        build.onResolve({ filter: /^stream$/ }, () => {
          return { path: require.resolve('readable-stream') }
        })
        build.onResolve({ filter: /^crypto$/ }, () => {
          return { path: require.resolve('crypto-browserify') }
        })
        build.onResolve({ filter: /^cborg$/ }, () => {
          return { path: require.resolve('cborg') }
        })
      }
    }
  ]
}

/** @type {import('aegir').PartialOptions} */
module.exports = {
  build: {
    config: buildConfig
  },
  test: {
    browser: {
      config: {
        buildConfig
      }
    }
  }
}
