
const fs = require('fs');

module.exports = (server) => {
    const io = require('socket.io')(server);
    io.on('connection', function (socket) {
        const gameEngine = require('../gameEngine')(io, socket);
        gameEngine.connection(socket);
        socket.on('disconnect', function () {
            gameEngine.disconnect();
        });
        socket.on('reconnectting', function (_data) {
            gameEngine.reconnectting(JSON.parse(_data));
        });
        socket.on('checkin', function (_data) {
            //user, roomId, option
            gameEngine.checkin(JSON.parse(_data));
        });
        socket.on('ready', function (_data) {
            gameEngine.ready(JSON.parse(_data));
        });
        socket.on('heartBeat', function (_data) {
            //gameEngine.heartBeat(JSON.parse(_data));
        });
        socket.on('exit', function (_data) {
            gameEngine.exit(JSON.parse(_data));
        });
        socket.on('chatMsg', function (_data) {
            gameEngine.chatMsg(JSON.parse(_data));
        });
    });

};