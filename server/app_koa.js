// 导入koa，和koa 1.x不同，在koa2中，我们导入的是一个class，因此用大写的Koa表示:
const Koa = require('koa'),
    bodyParser = require('koa-bodyparser'),
    response = require('./middlewares/response'),
    route = require('koa-route'),
    websockify = require('koa-websocket'),
    views = require('koa-views'),
    path = require('path'),
    Router = require('koa-router'),
    webpack = require('webpack');
const { devMiddleware, hotMiddleware } = require('koa-webpack-middleware');
const router = require('./routes');
const serve = require('koa-static');


// 创建一个Koa对象表示web app本身:
const app = new Koa();
app.use(bodyParser())
// 加载模板引擎
app.use(views(path.join(__dirname, './view'), {
    extension: 'ejs'
}))

app.use(serve(__dirname + "/dist/", { extensions: ['html'] }));
// 加载路由中间件
app.use(router.routes()).use(router.allowedMethods())
// app.ws.use(route.all('/test/:id'), function (ctx) {
//     // `ctx` is the regular koa context created from the `ws` onConnection `socket.upgradeReq` object.
//     // the websocket is added to the context on `ctx.websocket`.
//     ctx.websocket.send('Hello World');
//     ctx.websocket.on('message', function (message) {
//         // do something with the message from client
//         console.log(message);
//     });
// })

const webpackConfig = require('../webpack.config.babel');
const compiler = webpack(webpackConfig);

app.use(devMiddleware(compiler, {
    noInfo: true,
    quiet: true,
    lazy: true,
    reload: true,
    hot : true,
    inline: true,//启动inline
    watchOptions: {
        aggregateTimeout: 300,
        poll: true
    },
    publicPath: webpackConfig.output.publicPath,
    // custom headers 
    headers: { "X-Custom-Header": "yes" },
    //options for formating the statistics 
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
app.listen(3300);
console.log('app started at port 3000...');



/*
const config = require('../webpack.config.babel');
const compiler = webpack(config)
const PORT = process.env.PORT || 3000
const wdm = devMiddleware(compiler, {
    watchOptions: {
        aggregateTimeout: 300,
        poll: true
    },
    reload: true,
    publicPath: config.output.publicPath,
    stats: {
        colors: true
    }
})
app.use(convert(wdm))
app.use(convert(hotMiddleware(compiler)))
const server = app.listen(PORT, 'localhost', (err) => {
    if (err) {
        console.error(err)
        return
    }
    console.log(`HMR Listening at http://localhost:${PORT}`)
})
process.on('SIGTERM', () => {
    console.log('Stopping dev server')
    wdm.close()
    server.close(() => {
        process.exit(0)
    })
})
*/