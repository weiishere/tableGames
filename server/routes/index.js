

module.exports = (app) => {
    app.get('/home/', function (req, res, next) {
        res.render('index.ejs', {
            title: '模板项目',
            scripts: `<script src='https://cdn.socket.io/socket.io-1.4.5.js'></script><script src='/dist/home.bundle.js'></script>`
        });
    });
};