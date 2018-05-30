const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const appPath = path.resolve(__dirname, 'public');
const nodeModules = path.resolve(__dirname, 'node_modules');

//判断 dll 文件是否已生成
let dllExist = false;
try {
  fs.statSync(path.resolve(appPath, 'dll', 'vendor.dll.js'));
  dllExist = true;
} catch (e) {
  dllExist = false;
}

const webpackConfig = {
  cache: true, //开启缓存,增量编译
  devtool: 'source-map', //生成 source map文件
  resolve: {
    //自动扩展文件后缀名
    extensions: ['.js', '.less', '.png', '.jpg', '.gif'],
    //模块别名定义，方便直接引用别名
    // alias: {
    //   'react-router-redux': path.resolve(nodeModules, 'react-router-redux-fixed/lib/index.js'),
    // }
  },
  //mode: 'development',
  // 入口文件 让webpack用哪个文件作为项目的入口
  entry: {
    // app: ['./client/app', 'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=5000&reload=true']
    home: ['./client/home/index'],
    room: ['./client/room/index']
  },


  // 出口 让webpack把处理完成的文件放在哪里

  output: {
    // 编译输出目录, 不能省略
    path: path.resolve(appPath, 'dist/'),
    filename: '[name].bundle.js', //文件名称
    publicPath: '/dist/' //资源上下文路径
  },

  module: {
    rules: [{
      test: /\.(js|jsx)$/,
      loader: 'babel-loader?cacheDirectory=true',
      exclude: /(node_modules|bower_components)/,
      query: {
        plugins: [["import", { libraryName: "antd-mobile", style: true }]]
      }
    }, {
      test: /\.(css)$/,
      use: ExtractTextPlugin.extract({
        fallback: "style-loader",
        use: [{
          loader: 'css-loader'
        }, {
          loader: 'postcss-loader',
          options: {
            plugins: () => [autoprefixer({
              browsers: ['last 5 versions']
            })]
          }
        }, {
          loader: 'less-loader'
          
        }]
      })
    }, {
      test: /\.less$/,
      use: [{
        loader: "style-loader"
      }, {
        loader: "css-loader"
      }, {
        loader: "less-loader",
        options: { javascriptEnabled: true }
      }]
    }, {
      test: /\.(ico|png|gif|jpg|jpeg)$/,
      loader: 'url-loader'
    }],
  },
  plugins: [
    new ExtractTextPlugin("styles.css"),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(), // 热部署替换模块
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('development'),
      }
    })
  ]
};
module.exports = webpackConfig;

