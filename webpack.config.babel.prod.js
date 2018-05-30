const webpack = require('webpack')
const merge = require('webpack-merge');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const extend = require('extend');
const config = require("./webpack.config.babel.js");

const pro_config = extend(config, {
  devtool: '#cheap-module-source-map',//cheap-module-source-map',
  plugins: [
    // new webpack.NamedModulesPlugin(),
    // new webpack.HotModuleReplacementPlugin(),
    // // new ExtractTextPlugin({
    //   filename: "css/app.min.css"
    // }),
    // new webpack.DefinePlugin({
    //   compress: {
    //     warnings: false
    //   },
    //   comments: false,
    //   sourceMap: false
    // }),
    new ExtractTextPlugin("styles.css"),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("production")
    }),
    new webpack.optimize.UglifyJsPlugin()
  ]
});

module.exports = pro_config;


