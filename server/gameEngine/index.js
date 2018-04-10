const Room = require('./room');
const clone = require('clone');
let rooms = [];

module.exports = (io, scoket) => {
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
    const getRoom = (roomId) => {
        let room;//user,roomId,state
        const _rooms = rooms.filter(item => item.roomId + '' === roomId);
        if (_rooms.length === 1) room = _rooms[0];
        return room;
    }
    return {
        connection: () => {
            //console.log('接入链接-------------------------scoket.id ' + scoket.id);
        },
        disconnect: () => {
            //console.log('连接断开：---------------------------scoket.id:' + scoket.id);
            const room = findUserInRoom(scoket.user.uid);
            if (room) {
                room.gamerLeave(scoket.user.uid);
                if (room.gamers.length === 0) {
                    //如果人全部都离开了，清除room数据
                    rooms = rooms.filter(_room => _room.id !== room.id);
                } else {
                    setTimeout(() => {
                        console.log(`{"type":"notified","content":"${scoket.user.name}离开了房间ID:${room.roomId}"}`);
                        sendForRoom(room.roomId, `{"type":"notified","content":"${scoket.user.name}离开了房间ID:${room.roomId}"}`);
                        sendForRoom(room.roomId, `{"type":"roomData","content":${JSON.stringify(room.getSimplyData())}}`);
                    }, 500);
                }
            }
        },
        checkin: (data) => {
            //let data = JSON.parse(_data);//user, roomId, option
            const otherRoom = findUserInRoom(data.user.uid);
            if (otherRoom && otherRoom.roomId !== data.roomId) {
                setTimeout(() => {
                    scoket.emit('message', `{"type":"notified","content":"您已经在房间:${otherRoom.roomId}中，不能加入其他房间"}`);
                }, 1000);
                return;
            }
            const _rooms = rooms.filter(item => item.roomId + '' === data.roomId);
            if (_rooms.length === 1) {
                //走加入流程
                let room = _rooms[0];
                const isInRoom = room.gamers.filter(gamer => gamer.uid + '' === data.user.uid).length === 0 ? false : true;
                //data.user['catcher'] = false;
                scoket.user = data.user;
                if (!isInRoom) {
                    //没有在这个房间，那么需要加入
                    console.log(data.user.name + '加入房间ID:' + room.roomId);
                    room.gamerJoin(data.user);
                    //为用户注册scoket事件
                    //room.game.regAction(scoket, room);
                    room.game.regAction().forEach(item => {
                        scoket.on(item.actionName, function (data) {
                            item.actionFn.call(room.game,data);
                        })
                    })
                    setTimeout(() => {
                        sendForRoom(data.roomId, `{"type":"roomData","content":${JSON.stringify(room.getSimplyData())}}`);
                        setTimeout(() => {
                            sendForRoom(data.roomId, `{"type":"notified","content":"${data.user.name}加入房间ID:${room.roomId}"}`);
                        }, 100);
                    }, 500);
                } else {
                    setTimeout(() => {
                        //sendForRoom(data.roomId, `{"type":"notified","content":"${data.user.name}很装神，刷新了页面"}`);
                        sendForRoom(data.roomId, `{"type":"roomData","content":${JSON.stringify(room.getSimplyData())}}`);
                        setTimeout(() => {
                            //可能还在游戏中，发一个游戏状态
                            room.game.sendData()
                        }, 200);
                    }, 200);
                }
            } else {
                //走建房流程
                data.user.point = 1000;
                data.user.state = 'wait';
                const room = new Room({
                    roomId: data.roomId,
                    gamers: [data.user],
                    gamerNumber: data.option.gamerNumber,
                    mulriple: data.option.mulriple,//倍数
                    score: data.option.score,//底分
                    gameTime: data.option.gameTime,
                    state: 'wait',
                    gameType: 'majiang'
                });
                rooms.push(room);
                //data.user['catcher'] = true;
                scoket.user = data.user;
                console.log(data.user.name + '开房成功，房间ID:' + room.roomId);
                //为用户注册scoket事件
                //room.game.regAction(scoket);
                room.game.regAction().forEach(item => {
                    scoket.on(item.actionName, function (data) {
                        item.actionFn.call(room.game,data);
                    })
                })
                setTimeout(() => {
                    sendForRoom(data.roomId, `{"type":"roomData","content":${JSON.stringify(room.getSimplyData())}}`);
                    setTimeout(() => {
                        sendForRoom(data.roomId, `{"type":"notified","content":"${data.user.name}成功开房间ID:${room.roomId}"}`);
                    }, 100);
                }, 500);
            }

        },
        ready: (data) => {
            let room = getRoom(data.roomId);
            room.setUserState(data.user.uid, data.state);
            if (room.gamers.filter(gamer => gamer.state === 'ready').length === room.gamerNumber) {
                //准备人数等于规定人数，游戏开始
                room.state = 'playing';
                //room.setEnd(function () { });
                room.begin(scoket, sendForRoom, sendForUser);
            } else {
                if (room.game.isOver) {
                    sendForUser(data.user.uid, `{"type":"gameData","content":""} `);//重置gameData
                }
            }
            setTimeout(() => {
                //sendForUser(data.user.uid, `{"type":"notified","content":"${data.user.name}成功开房间ID:${room.roomId}"}`);
                sendForRoom(room.roomId, `{"type":"roomData","content":${JSON.stringify(room.getSimplyData())}}`);
            }, 50);
        }
        //注册游戏客户端动作
        // regAction: (scoket) => {
        //     const room = this.getRoom(data.roomId);
        //     room.game.regAction(scoket, this);
        // }
    }
}