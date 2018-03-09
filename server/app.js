// 导入koa，和koa 1.x不同，在koa2中，我们导入的是一个class，因此用大写的Koa表示:
const Koa = require('koa'),
    bodyParser = require('koa-bodyparser'),
    response = require('./middlewares/response'),
    route = require('koa-route'),
    websockify = require('koa-websocket'),
    webpack = require('webpack');
const { devMiddleware, hotMiddleware } = require('koa-webpack-middleware');

// 创建一个Koa对象表示web app本身:
const app = websockify(new Koa());
app.use(bodyParser())
// 对于任何请求，app将调用该异步函数处理请求：
app.use(async (ctx, next) => {
    await next();
    ctx.response.type = 'text/html';
    ctx.response.body = '<h1>Hello, koa2!</h1>';
});
app.ws.use(route.all('/test/:id'), function (ctx) {
    // `ctx` is the regular koa context created from the `ws` onConnection `socket.upgradeReq` object.
    // the websocket is added to the context on `ctx.websocket`.
    ctx.websocket.send('Hello World');
    ctx.websocket.on('message', function (message) {
        // do something with the message from client
        console.log(message);
    });
})

const webpackConfig = require('../webpack.config.babel');
const compiler = webpack(webpackConfig);

//热部署，自动刷新，需要结合 webpack.config.dev.babel 中的定义
// app.use(webpackDevMiddleware(compiler, {
//     noInfo: true, //如果设置该参数为 true，则不打印输出信息
//     cache: true, //开启缓存，增量编译
//     stats: {
//         colors: true, //打印日志显示颜色
//         reasons: true //打印相关被引入的模块
//     },
//     publicPath: webpackConfig.output.publicPath,
//     //log: logger.info,
//     path: '/__webpack_hmr',
//     heartbeat: 10 * 1000
// }));


app.use(devMiddleware(compiler, {
    noInfo: false,
    quiet: false,
    lazy: true,
    watchOptions: {
        aggregateTimeout: 300,
        poll: true
    },
    publicPath: webpackConfig.output.publicPath,
    // custom headers 
    headers: { "X-Custom-Header": "yes" },
    // options for formating the statistics 
    stats: {
        colors: true
    }
}))
app.use(hotMiddleware(compiler, {
    log: console.log,
    path: '/__webpack_hmr',
    heartbeat: 10 * 1000
}))

// 在端口3000监听:
app.listen(3000);
console.log('app started at port 3000...');