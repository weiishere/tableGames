const Room = require('./room');
const clone = require('clone');
const writeLog = require('../util/errorLog');
const sqliteCommon = require('../sqliteCommon');
let rooms = [];



//每60分钟清理一下state=end、上次活跃时间大于1小时且未激活的room，上次活跃时间由sqlite查询获得
//sqliteCommon.getList({}, (rows) => { console.log(rows) });
setInterval(function () {
    sqliteCommon.getList({}, (rows) => {
        let roomIds = [];
        rows.forEach(row => {
            if (Date.now() - row.updateTime >= 60 * 60 * 1000 || row.state === 2) {
                roomIds.push(row.roomId);
            }
        });
        sqliteCommon.deleteRoom({ roomIds }, (changes) => {
            console.log('(' + (new Date()).toLocaleString() + ')' + '清理房间数据' + changes + '条');
            //console.log(roomIds)
        });
        // roomIds.forEach(itemid => {
        //     rooms = rooms.filter(room => room.roomId !== itemid);
        // });
        rooms = rooms.filter(room => roomIds.indexOf(room.roomId) === -1 ? true : false);//清理内存room的数据
    });
}, 60 * 60 * 1000);



module.exports = (io, scoket) => {
    const sendForUser = (uid, content) => {
        for (let i in io.sockets.sockets) {
            const item = io.sockets.sockets[i];
            if (item.user && item.user.uid === uid) {
                //console.log(`发送消息给${item.user.name}：${content}`);
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
        let resultRooms = [];
        for (let i = 0; i < roomsLength; i++) {
            const gamers = rooms[i].gamers;
            const gamersLength = gamers.length;
            for (let j = 0; j < gamersLength; j++) {
                if (gamers[j].uid === uid) {
                    resultRooms.push(rooms[i]);
                    break;
                    //return rooms[i];
                }
            }
        }
        return resultRooms;
    }
    const getRoom = (roomId) => {
        let resultRooms;//user,roomId,state
        const _rooms = rooms.filter(item => item.roomId + '' === roomId);
        if (_rooms.length === 1) {
            resultRooms = _rooms[0];
        } else if (_rooms.length === 0) {
            //到sqllite里面去找，如果要考虑内存丢失，恢复数据的情况下可以考虑(待定)

        }
        return resultRooms;
    }
    return {
        connection: (scoket) => {
            //console.log('接入链接-------------------------scoket.id ' + scoket.id);

        },
        disconnect: () => {
            //console.log('连接断开：---------------------------scoket.id:' + scoket.id);
            if (!scoket.user) return;
            const resultRooms = findUserInRoom(scoket.user.uid);
            resultRooms.forEach(room => {
                if (room) {
                    if (room.state === 'playing') {
                        //正在进行的游戏
                        //room.game.regAction(scoket, this);
                    } else {
                        room.gamerLeave(scoket.user.uid);
                        if (room.gamers.length === 0) {
                            //如果人全部都离开了，清除room数据
                            rooms = rooms.filter(_room => _room.id !== room.id);
                        } else {
                            setTimeout(() => {
                                //console.log(`{"type":"notified","content":"${scoket.user.name}离开了房间ID:${room.roomId}"}`);
                                sendForRoom(room.roomId, `{"type":"notified","content":"${scoket.user.name}离开了房间"}`);
                                sendForRoom(room.roomId, `{"type":"roomData","content":${JSON.stringify(room.getSimplyData())}}`);
                            }, 50);
                        }
                    }
                }
            })

        },
        reconnectting: (data) => {
            scoket.user = data.user;
            //const room = findUserInRoom(data.user.uid);
            const room = rooms.find(r => r.roomId === data.roomId);
            if (room) {
                setTimeout(() => {
                    sendForRoom(room.roomId, `{"type":"roomData","content":${JSON.stringify(room.getSimplyData())}}`);
                }, 50);
                if (room.game) {
                    room.game.regAction().forEach(item => {
                        scoket.on(item.actionName, function (data) {
                            item.actionFn.call(room.game, data);
                        })
                    });
                    setTimeout(() => {
                        room.game.sendData();
                    }, 70);
                }
            }

        },
        checkin: (data) => {
            try {
                //判断是否在其他牌局当中（暂时取消这个约束）
                // const otherRoom = findUserInRoom(data.user.uid);
                // if (otherRoom && otherRoom.roomId !== data.roomId) {
                //     setTimeout(() => {
                //         console.log(`您已经在房间:${otherRoom.roomId}中，不能加入其他房间"}`);
                //         scoket.emit('message', `{"type":"errorInfo","content":"对不起，您已经在其他房间（单局游戏中），单局结束之前不允许加入其他房间"}`);
                //         //scoket.emit('message', `{"type":"errorInfo","content":"您已经在房间:${otherRoom.roomId}中，不能加入其他房间"}`);
                //     }, 2000);
                //     return;
                // }
                //const _rooms = rooms.filter(item => item.roomId + '' === data.roomId);
                const _rooms = getRoom(data.roomId);
                if (_rooms) {
                    //走加入流程
                    let room = _rooms;
                    const isInRoom = room.gamers.filter(gamer => gamer.uid === data.user.uid).length === 0 ? false : true;
                    //data.user['catcher'] = false;
                    scoket.user = data.user;
                    if (!isInRoom) {
                        //没有在这个房间，那么需要加入
                        //如果人满了或者正在游戏中，拒绝加入
                        if (room.gamers.length === room.gamerNumber) {
                            //console.log(`房间人数已满~`);
                            setTimeout(() => { sendForUser(data.user.uid, `{"type":"errorInfo","content":"对不起，房间人数已满~"}`); }, 2000);
                            //scoket.emit('message', `{"type":"errorInfo","content":"对不起，房间人数已满~"}`);
                            return;
                        }
                        //console.log(data.user.name + '加入房间ID:' + room.roomId);
                        room.gamerJoin(data.user);
                        //为用户注册scoket事件
                        //room.game.regAction(scoket, room);

                        setTimeout(() => {
                            sendForRoom(data.roomId, `{"type":"roomData","content":${JSON.stringify(room.getSimplyData())}}`);
                            setTimeout(() => {
                                sendForRoom(data.roomId, `{"type":"notified","content":"${data.user.name}加入房间"}`);
                            }, 50);
                        }, 1000);
                    } else {
                        //如果用户还在这个房间，说明房间肯定是在游戏中（因为如果在游戏中退出，不会清理用户数据）
                        setTimeout(() => {
                            //sendForRoom(data.roomId, `{"type":"notified","content":"${data.user.name}很装神，刷新了页面"}`);
                            sendForRoom(data.roomId, `{"type":"roomData","content":${JSON.stringify(room.getSimplyData())}}`);
                            setTimeout(() => {
                                //可能还在游戏中，发一个游戏状态
                                room.game.sendData();
                            }, 50);
                        }, 1000);
                    }
                    room.game.regAction().forEach(item => {
                        scoket.on(item.actionName, function (data) {
                            item.actionFn.call(room.game, data);
                        })
                    });
                    sqliteCommon.updateState({
                        roomId: data.roomId,
                        state: 1
                    });
                } else {
                    //走建房流程
                    //找到房间后先更新房间状态为1（已激活）
                    sqliteCommon.getOne({
                        roomId: data.roomId
                    }, (result) => {
                        //console.log(result);
                        if (+result.checkiner !== +data.user.uid && result.state === 0) {
                            //非创建者开房，弹出未激活
                            setTimeout(() => {
                                scoket.emit('message', `{"type":"errorInfo","content":"对不起，此房间尚未由创建者激活，请稍候..."}`);
                            }, 2000);
                            return;
                        }
                        sqliteCommon.updateState({
                            roomId: data.roomId,
                            state: 1
                        }, (result2) => {
                            //开始初始化room到内存
                            const jsonData = JSON.parse(result.jsonData);
                            data.user.point = 0;
                            data.user.state = 'wait';
                            const room = new Room({
                                roomId: result.roomId,
                                gamers: [data.user],
                                gamerNumber: data.option.gamerNumber || jsonData.mulriple,//测试的时候这个可能会变
                                mulriple: data.option.mulriple || jsonData.mulriple,//倍数
                                gameTime: data.option.gameTime || jsonData.gameTime,
                                countdown: data.option.countdown || jsonData.countdown,//倒计时
                                state: 'wait',
                                gameType: 'majiang',
                                rule: data.option.rule || jsonData.rule,
                                colorType: data.option.colorType || jsonData.colorType || 3
                            });
                            rooms.push(room);
                            //data.user['catcher'] = true;
                            scoket.user = data.user;
                            console.log('(' + (new Date()).toLocaleString() + ')' + data.user.name + '开房成功，房间ID:' + room.roomId);
                            //为用户注册scoket事件
                            //room.game.regAction(scoket);
                            room.game.regAction().forEach(item => {
                                scoket.on(item.actionName, function (data) {
                                    item.actionFn.call(room.game, data);
                                })
                            })
                            setTimeout(() => {
                                sendForRoom(data.roomId, `{"type":"roomData","content":${JSON.stringify(room.getSimplyData())}}`);
                                setTimeout(() => {
                                    sendForRoom(data.roomId, `{"type":"notified","content":"${data.user.name}成功开房间"}`);
                                }, 100);
                            }, 500);
                        });
                    });

                }
            } catch (e) {
                writeLog('checkin', e);
            }
        },
        ready: (data) => {
            let room = getRoom(data.roomId);
            if (!room) {
                setTimeout(() => {
                    scoket.emit('message', `{"type":"errorInfo","content":"抱歉，此房间已过期..."}`);
                }, 2000);
                return;
            }
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
            //准备时更新下活动状态（主要更新最后活跃时间）
            sqliteCommon.updateState({ roomId: data.roomId, state: 1 });
            setTimeout(() => {
                //sendForUser(data.user.uid, `{"type":"notified","content":"${data.user.name}成功开房间ID:${room.roomId}"}`);
                sendForRoom(room.roomId, `{"type":"roomData","content":${JSON.stringify(room.getSimplyData())}}`);
            }, 50);
        },
        heartBeat: (data) => {
            const room = rooms.find(r => r.roomId === data.roomId);
            if (room) {
                if (room.state === 'playing') {
                    room.game.sendData({ uid: data.uid });
                }
            }
            // const room = getRoom(data.roomId);
            // room.game.sendData();
        },
        chatMsg: (data) => {
            setTimeout(() => {
                sendForRoom(data.roomId, `{"type":"chat","content":${JSON.stringify({
                    name: data.name,
                    content: data.content
                })}}`);
            }, 50);
        }
        //注册游戏客户端动作
        // regAction: (scoket) => {
        //     const room = this.getRoom(data.roomId);
        //     room.game.regAction(scoket, this);
        // }
    }
}