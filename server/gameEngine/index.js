const Room = require('./room');
const clone = require('clone');
let rooms = [];

module.exports = (io, socket) => {
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
    return {
        connection: () => {
            //console.log('接入链接-------------------------socket.id ' + socket.id);
        },
        disconnect: () => {
            //console.log('连接断开：---------------------------socket.id:' + socket.id);
            const room = findUserInRoom(socket.user.uid);
            if (room) {
                room.gamerLeave(socket.user.uid);
                setTimeout(() => {
                    console.log(`{"type":"notified","content":"${socket.user.name}离开了房间ID:${room.roomId}"}`);
                    sendForRoom(room.roomId, `{"type":"notified","content":"${socket.user.name}离开了房间ID:${room.roomId}"}`);
                    sendForRoom(room.roomId, `{"type":"roomData","content":${JSON.stringify(room)}}`);
                }, 500);
            }
        },
        checkin: (data) => {
            //let data = JSON.parse(_data);//user, roomId, option
            const otherRoom = findUserInRoom(data.user.uid);
            if (otherRoom && otherRoom.roomId !== data.roomId) {
                setTimeout(() => {
                    socket.emit('message', `{"type":"notified","content":"您已经在房间:${otherRoom.roomId}中，不能加入其他房间"}`);
                }, 1000);
                return;
            }
            const _rooms = rooms.filter(item => item.roomId + '' === data.roomId);
            if (_rooms.length === 1) {
                //走加入流程
                let room = _rooms[0];
                const isInRoom = room.gamers.filter(gamer => gamer.uid + '' === data.user.uid).length === 0 ? false : true;
                socket.user = data.user;
                if (!isInRoom) {
                    //没有在这个房间，那么需要加入
                    console.log(data.user.name + '加入房间ID:' + room.roomId);
                    room.gamerJoin(data.user);
                    setTimeout(() => {
                        sendForRoom(data.roomId, `{"type":"roomData","content":${JSON.stringify(room)}}`);
                        setTimeout(() => {
                            sendForRoom(data.roomId, `{"type":"notified","content":"${data.user.name}加入房间ID:${room.roomId}"}`);
                        }, 100);
                    }, 500);
                } else {
                    setTimeout(() => {
                        sendForRoom(data.roomId, `{"type":"notified","content":"${data.user.name}很装神，刷新了页面"}`);
                        sendForRoom(data.roomId, `{"type":"roomData","content":${JSON.stringify(room)}}`);
                    }, 500);
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
                socket.user = data.user;
                console.log(data.user.name + '开房成功，房间ID:' + room.roomId);

                setTimeout(() => {
                    sendForRoom(data.roomId, `{"type":"roomData","content":${JSON.stringify(room)}}`);
                    setTimeout(() => {
                        sendForRoom(data.roomId, `{"type":"notified","content":"${data.user.name}成功开房间ID:${room.roomId}"}`);
                    }, 100);
                }, 500);
            }
        },
        ready: (data) => {
            let room;//user,roomId,state
            const _rooms = rooms.filter(item => item.roomId + '' === data.roomId);
            if (_rooms.length === 1) room = _rooms[0];
            room.setUserState(data.user.uid, data.state);
            if (room.gamers.filter(gamer => gamer.state === 'ready').length === room.gamerNumber) {
                //准备人数等于规定人数，游戏开始
                room.setSendMsg(function (content) {
                    //sendForRoom(data.roomId, `{"type":"gameData","content":${JSON.stringify(content)}}`);
                    room.gamers.forEach(gamer => {
                        const _data = {
                            gameState: (() => {
                                let result = new Object(), l = content.gameState.length;
                                for (let i = 0; i < l; i++) {
                                    const userState = content.gameState[i];
                                    result['user_' + userState.uid] = clone(userState);
                                    if (userState.uid !== gamer.uid) {
                                        result['user_' + userState.uid].cards = userState.cards.length;
                                    }
                                }
                                return result;
                            })(),
                            // gameState: content.gameState.map(state => {
                            //     return {
                            //         uid: state.uid,
                            //         increase: state.increase,
                            //         cards: state.uid == gamer.uid ? state.cards : state.cards.length,//不是自己的话则返回数量
                            //         groupCards: state.groupCards
                            //     }
                            // }),
                            outCards: content.outCards,
                            remainCardNumber: content.remainCardNumber
                        }
                        sendForUser(gamer.uid, `{"type":"gameData","content":${JSON.stringify(_data)}} `);
                    });
                })
                room.setEnd(function () {

                });
                room.begin();
            }
            setTimeout(() => {
                //sendForUser(data.user.uid, `{"type":"notified","content":"${data.user.name}成功开房间ID:${room.roomId}"}`);
                sendForRoom(room.roomId, `{"type":"roomData","content":${JSON.stringify(room)}}`);
            }, 100);
        }
    }
}