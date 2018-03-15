
const fs = require('fs');
const Room = require('../gameEngine/room');

module.exports = (server) => {
    const io = require('socket.io')(server);
    const rooms = [];
    io.on('connection', function (socket) {
        console.log('接入链接-------------------------socket.id ' + socket.id);
        socket.on('disconnect', function () {
            console.log('连接断开：---------------------------socket.id:' + socket.id);
        });
        socket.on('checkin', function (data) {
            let data = JSON.parse(data);
            if (io.sockets.sockets.filter(item => item.user.uid === data.uid ).length !== 0) {
                sendForUser(data.uid, "{type:'error',msg:'已经在房间了，不能再开房'}");
                return;
            }
            data.user.point = 1000;
            data.user.state = 'wait';
            const room = new Room({
                gamers: [data.user],
                maxGamerNumber: data.option.maxGamerNumber,
                mulriple: data.option.mulriple,//倍数
                score: data.option.score,//底分
                gameTime: data.option.gameTime,
                state: 'wait'
            });
            rooms.push(room);
            socket.user = data.user;
        });
        socket.on('join', function (_data) {
            let data = JSON.parse(_data);
            const rooms = rooms.filter(item => { item.roomId === data.roomId });
            if (rooms.length !== 1) {
                //房间数量不对（只能有一个）
                item.emit('message', JSON.stringify({ type: 'error', msg: '房间错误、房间不存在、房间已经散场' }));
                return;
            } else {
                //是否已经在这个房间
                const isInRoom = rooms.gamers.filter(gamer => gamer.uid === data.user.uid).length === 0 ? false : true;
                if (!isInRoom) {
                    //没有在这个房间，那么需要加入
                    rooms[0].gamers.push(data.user);
                    socket.user = data.user;
                } else {
                    //在这个房间，要先搜寻所有的room并找下是否在其他房间，如果在就提示先退出，如果没有再新增，我靠，这个有点麻烦
                }
                // for (let i in io.sockets.sockets) {
                //     const item = io.sockets.sockets[i];
                //     if (item.user.uid === data.user.uid) {
                //         sendForUser(data.user.uid, "{type:'error',msg:'已经在其他房间了，不能再加入'}");
                //         return;
                //     }
                // }
            }

            //item.emit('message', JSON.stringify({ type: 'error', msg: '房间错误' }));
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
    const sendForUser = (uid, content) => {
        for (let i in io.sockets.sockets) {
            const item = io.sockets.sockets[i];
            if (item.user.uid === uid) {
                console.log(uid + '-' + _mes);
                item.emit('message', content);
                return;
            }
        }
    }
    const sendForRoom = (roomId, content) => {
        const rooms = rooms.filter(item => { item.roomId === roomId });
        if (rooms.length === 1) {
            rooms.gamers.forEach(gamer => {
                sendForUser(gamer.uid, content);
            });
        } else {
            //房间数量不对（只能有一个）
        }
    }
};