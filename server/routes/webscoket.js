
const fs = require('fs');

module.exports = (server) => {
    const io = require('socket.io')(server);
    io.on('connection', function (socket) {
        console.log('接入链接-------------------------socket.id ' + socket.id);
        socket.on('disconnect', function () {
            console.log('连接断开：---------------------------socket.id:' + socket.id);
        });
        socket.on('setName', function (data) {
            console.log('---------------------------设置名称:' + data);
            socket.name = data;
        });
        socket.on('sayTo', function (data) {
            for (let i in io.sockets.sockets) {
                const item = io.sockets.sockets[i];
                if (item.name === data.to) {
                    const _mes = `---------------------------${data.from}对${data.to}说:${data.msg}`
                    console.log(_mes);
                    item.emit('message', _mes);
                }
            }
        })
    });
};