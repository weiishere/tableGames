

const apiRoute = require('./api');
module.exports = (app) => {
    apiRoute(app);
    app.get('/home/', function (req, res, next) {
        res.render('index.ejs', {
            title: '掌派桌游-创建房间',
            scripts: `<script src='http://apps.bdimg.com/libs/fastclick/1.0.0/fastclick.min.js'></script><script src='/dist/home.bundle.js'></script>`
        });
    });
    app.get('/room/', function (req, res, next) {
        res.render('room.ejs', {
            title: '掌派桌游-房间',
            scripts: `<script src='/frame/socket.io-1.4.5.js'></script><script src='/dist/room.bundle.js?dist=043003'></script>`
        });
    });


    // app.post('/api/login', function (req, res) {
    //     const { openId } = req.body;
    // });


    // app.post('/api/login', function (req, res) {
    //     // 输出 JSON 格式
    //     response = {
    //         first_name: req.body.first_name,
    //         last_name: req.body.last_name
    //     };
    //     console.log(response);
    //     res.end(JSON.stringify(response));
    // })
};