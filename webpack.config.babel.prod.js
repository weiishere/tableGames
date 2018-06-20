const path = require('path');
const webpack = require('webpack')
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const extend = require('extend');
const config = require("./webpack.config.babel.js");
const appPath = path.resolve(__dirname, 'public');
const version = 'v1'

const pro_config = extend(config, {
  entry: {
    dll: ['antd-mobile', 'react', 'react-dom', 'react-router-dom'],
    home: ['./client/home/index'],
    room: ['./client/room/index']
  },
  output: {
    // 编译输出目录, 不能省略
    path: path.resolve(appPath, `dist_${version}/`),
    filename: '[name].bundle.js', //文件名称
    publicPath: `/dist_${version}/` //资源上下文路径
  },
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


