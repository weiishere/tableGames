

module.exports = (app, options) => {
    app.get('/showPlatform**', function (req, res, next) {
        renderTemplateSync(req, res, {
            title: '项目展示平台',
            name: 'showPlatform',
            scripts: ""
        })
    })


    app.get('/', function (req, res, next) {
        if (req.method === 'GET') {//head请求也会拦截到，在线上nginx会以head请求发送心跳请求
            renderIndex(req, res, next);
        } else {
            res.end('ok');
        }
    });

    // 将未知的页面请求重定向到首页
    app.get('*', function (req, res, next) {
        if (/\.{1}(ico|png|jpg|gif|js|css|map|json)(\?.*|$)/.test(req.url)) {
            return next();
        }
        logger.info('unknow resource,redirect to /,request url :' + req.url);

        renderIndex(req, res, next);
    });
};