
const fs = require('fs');

module.exports = (server) => {
    const io = require('socket.io')(server);
    io.on('connection', function (socket) {
        const gameEngine = require('../gameEngine')(io, socket);
        gameEngine.connection();
        socket.on('disconnect', function () {
            gameEngine.disconnect();
        });
        socket.on('checkin', function (_data) {
            //user, roomId, option
            gameEngine.checkin(JSON.parse(_data));
        });
        socket.on('ready', function (_data) {
            gameEngine.ready(JSON.parse(_data));
        });
        // socket.on('showCard', function (_data) {
        //     gameEngine.ready(JSON.parse(_data));
        // });
    });

};