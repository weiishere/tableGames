
const fs = require('fs');
const Room = require('../gameEngine/room');

module.exports = (server) => {
    const io = require('socket.io')(server);
    const rooms = [];
    io.on('connection', function (socket) {
        //console.log('接入链接-------------------------socket.id ' + socket.id);
        socket.on('disconnect', function () {
            console.log('连接断开：---------------------------socket.id:' + socket.id);
        });
        socket.on('checkin', function (_data) {
            let data = JSON.parse(_data);
            const otherRoom = findUserInRoom(data.user.uid);
            if (otherRoom && otherRoom.roomId !== data.roomId) {
                setTimeout(() => {
                    socket.emit('message', `{"type":"notified","msg":"您已经在房间:${otherRoom.roomId}中，不能加入其他房间"}`);
                    //sendForUser(data.user.uid, `{"type":"notified","msg":"您已经在房间:${otherRoom.roomId}中，不能加入其他房间"}`);
                }, 1000);
                return;
            }
            const _rooms = rooms.filter(item => item.roomId + '' === data.roomId);
            if (_rooms.length === 1) {
                //走加入流程
                let room = _rooms[0];
                const isInRoom = room.gamers.filter(gamer => gamer.uid + '' === data.user.uid).length === 0 ? false : true;
                if (!isInRoom) {
                    //没有在这个房间，那么需要加入
                    room.gamers.push(data.user);
                    socket.user = data.user;
                    console.log(data.user.name + '加入房间ID:' + room.roomId);
                    setTimeout(() => {
                        sendForRoom(data.roomId, `{"type":"notified","msg":"${data.user.name}加入房间ID:${room.roomId}"}`);
                    }, 2000);
                    //sendForRoom(data.roomId, `{"type":"notified","msg":"${data.user.name}加入房间ID:${room.roomId}}`);
                } else {
                    socket.user = data.user;
                    setTimeout(() => {
                        sendForRoom(data.roomId, `{"type":"notified","msg":"${data.user.name}很装神，刷新了页面"}`);
                    }, 2000);
                }
            } else {
                //走建房流程
                data.user.point = 1000;
                data.user.state = 'wait';
                const room = new Room({
                    roomId: data.roomId,
                    gamers: [data.user],
                    maxGamerNumber: data.option.maxGamerNumber,
                    mulriple: data.option.mulriple,//倍数
                    score: data.option.score,//底分
                    gameTime: data.option.gameTime,
                    state: 'wait'
                });
                rooms.push(room);
                socket.user = data.user;
                console.log(data.user.name + '开房成功，房间ID:' + room.roomId);

                setTimeout(() => {
                    sendForUser(data.user.uid, `{"type":"notified","msg":"${data.user.name}成功开房间ID:${room.roomId}"}`);
                }, 1000);
            }
        });
    });
    const sendForUser = (uid, content) => {
        for (let i in io.sockets.sockets) {
            const item = io.sockets.sockets[i];
            if (item.user && item.user.uid === uid) {
                console.log(`发送消息给${item.user.name}：${content}`);
                item.emit('message', content);
                return;
            }
        }
    }
    const sendForRoom = (roomId, content) => {
        const _rooms = rooms.filter(item => item.roomId + '' === roomId);
        if (_rooms.length === 1) {
            _rooms[0].gamers.forEach(gamer => {
                sendForUser(gamer.uid, content);
            });
        } else {
            //房间数量不对（只能有一个）
        }
    }
    //寻找用户是否有没有参与其他的房间，有则返回房间信息
    const findUserInRoom = (uid) => {
        const roomsLength = rooms.length;
        for (let i = 0; i < roomsLength; i++) {
            const gamers = rooms[i].gamers;
            const gamersLength = gamers.length;
            for (let j = 0; j < gamersLength; j++) {
                if (gamers[j].uid === uid) {
                    return rooms[i];
                }
            }
        }
        return null;
    }
};