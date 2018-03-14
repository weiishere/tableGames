

module.exports = (app) => {
    app.get('/home/', function (req, res, next) {
        res.render('index.ejs', {
            title: 'HOME',
            scripts: `<script src='https://cdn.socket.io/socket.io-1.4.5.js'></script><script src='/dist/home.bundle.js'></script>`
        });
    });
    app.get('/room/', function (req, res, next) {
        res.render('room.ejs', {
            title: 'ROOM',
            scripts: `<script src='https://cdn.socket.io/socket.io-1.4.5.js'></script><script src='/dist/room.bundle.js'></script>`
        });
    });
};