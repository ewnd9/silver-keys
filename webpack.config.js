'use strict';

const path = require('path');

module.exports = {
  cache: true,
  entry: {
    'content-scripts/index.js': path.resolve(`${__dirname}/src/content-scripts/index.js`),
  },
  devtool: 'cheap-module-source-map',
  output: {
    filename: '[name].bundle.js',
    sourceMapFilename: '[file].map',
    path: path.resolve(`${__dirname}/dist`),
    publicPath: '/'
  },
  resolve: {
    modules: ['node_modules']
  }
};

