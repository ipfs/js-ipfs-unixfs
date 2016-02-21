const path = require('path')

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['mocha'],

    files: [
      'tests/browser.js'
    ],

    preprocessors: {
      'tests/*': ['webpack', 'sourcemap']
    },

    webpack: {
      devtool: 'eval',
      resolve: {
        extensions: ['', '.js', '.json']
      },
      externals: {
        fs: '{}'
      },
      node: {
        Buffer: true
      },
      module: {
        loaders: [
          { test: /\.json$/, loader: 'json' }
        ],
        postLoaders: [
          {
            include: path.resolve(__dirname, 'node_modules/ipfs-unixfs'),
            loader: 'transform?brfs'
          }
        ]
      }
    },

    webpackMiddleware: {
      noInfo: true,
      stats: {
        colors: true
      }
    },
    reporters: ['spec'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: process.env.TRAVIS ? ['Firefox'] : ['Chrome'],
    singleRun: true
  })
}
