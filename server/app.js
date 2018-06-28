// 引入模块
const express = require('express');
const http = require('http');
const path = require('path');
const webpack = require('webpack');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const app = express();
const route = require('./routes');
const webscoket = require('./routes/webscoket');
app.set('views', path.join(__dirname, 'view'));
app.set('view engine', 'ejs');
app.use(bodyParser.json({ limit: '20mb' }));//设置前端post提交最大内容
app.use(bodyParser.urlencoded({ limit: '20mb', extended: false }));
app.use(bodyParser.text());

//--------------------------------------------------------------------------
// 静态文件配置
app.use(express.static(path.join(__dirname, '../public')));
const prot = 8800;
const webpackConfig = require('../webpack.config.babel');
const compiler = webpack(webpackConfig);
//热部署，自动刷新，需要结合 webpack.config.dev.babel 中的定义
app.use(require('webpack-dev-middleware')(compiler, {
    noInfo: true, //如果设置该参数为 true，则不打印输出信息
    cache: true, //开启缓存，增量编译
    stats: {
        colors: true, //打印日志显示颜色
        reasons: false //打印相关被引入的模块
    },
    publicPath: webpackConfig.output.publicPath
}));

app.use(require('webpack-hot-middleware')(compiler, {
    log: console.log,
    path: '/__webpack_hmr',
    heartbeat: 10 * 1000
}));
const server = http.createServer(app);
webscoket(server);
route(app);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    //不处理 map 和 json 格式的数据
    if (/\.(map|json)$/.test(req.url)) {
        return next();
    }
    const err = new Error(`${req.url},Not Found`);
    err.status = 404;
    next(err);
});
// error handlers
app.use((err, req, res, next) => {
    // if (req.url.startsWith('/api')) {
    //     const msg = errorHandler(err);
    //     return res.status(200).json({
    //         code: err.code || 'E-50x',
    //         msg
    //     });
    // }

    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: err
    });
});


server.listen(prot);
server.on('error', (e) => { console.log(e); });
server.on('listening', () => { console.log(`listening prot ${prot}`); });

///module.exports = app;