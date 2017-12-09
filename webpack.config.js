'use strict';

const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  cache: true,
  entry: {
    'content-scripts/index': path.resolve(`${__dirname}/src/content-scripts/index.js`),
    'background/index': path.resolve(`${__dirname}/src/background/index.js`),
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
  },
  plugins: [
    new CopyPlugin([{
      from: 'manifest.json',
    }, {
      from: 'pages',
      to: 'pages'
    }, {
      from: 'icons',
      to: 'icons'
    }])
  ]
};

