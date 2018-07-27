const Room = require('./room');
const clone = require('clone');
const writeLog = require('../util/errorLog');
const sqliteCommon = require('../sqliteCommon');
const MsgExplorer = require('./msgExplorer');
global.allRooms = [];
//let global.allRooms = global.allRooms;



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
            //console.log('(' + (new Date()).toLocaleString() + ')' + '清理房间数据' + changes + '条');
            //console.log(roomIds)
        }, (error) => {
            writeLog('API deleteRoom error', error);
        });
        // roomIds.forEach(itemid => {
        //     global.allRooms = global.allRooms.filter(room => room.roomId !== itemid);
        // });
        global.allRooms = global.allRooms.filter(room => {
            if (roomIds.indexOf(room.roomId) === -1) {
                return true;
            } else {
                if (room && room.game) {
                    room.game.timer.end();
                    room.game = null;
                }
                return false;
            }
        });//清理内存room的数据
    }, (error) => {
        writeLog('API getList error', error);
    });
}, 60 * 60 * 1000);


let msgExplorer = new MsgExplorer();
msgExplorer.run();

module.exports = (io, scoket) => {
    const sendForUser = (uid, content) => {
        for (let i in io.sockets.sockets) {
            const item = io.sockets.sockets[i];
            if (item.user && item.user.uid === uid) {
                //console.log(`发送消息给${item.user.name}：${content}`);
                let key = undefined; const con = JSON.parse(content);
                if (con.type === 'roomData' || con.type === 'gameData') {
                    key = con.type;
                }
                msgExplorer.push(item, content, key);
                //item.emit('message', content);
                return;
            }
        }
    }
    const sendForRoom = (roomId, content) => {
        const _rooms = global.allRooms.filter(item => item.roomId + '' === roomId);
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
        const roomsLength = global.allRooms.length;
        let resultRoom = null;
        for (let i = 0; i < roomsLength; i++) {
            const gamers = global.allRooms[i].gamers;
            const gamersLength = gamers.length;
            for (let j = 0; j < gamersLength; j++) {
                if (gamers[j].uid === uid && gamers[j].state !== 'end') {
                    resultRoom = global.allRooms[i];
                    break;
                    //return global.allRooms[i];
                }
            }
        }
        return resultRoom;
    }
    const getRoom = (roomId) => {
        let resultRooms;//user,roomId,state
        const _rooms = global.allRooms.filter(item => item.roomId + '' === roomId + '');
        if (_rooms.length === 1) {
            resultRooms = _rooms[0];
        } else if (_rooms.length === 0) {
            //到sqllite里面去找，如果要考虑内存丢失，恢复数据的情况下可以考虑(待定)

        } else {
            console.log('出现了两条同样的room信息');
            resultRooms = _rooms[0];
        }
        return resultRooms;
    }
    const checkin = (data) => {
        try {
            //判断是否在其他牌局当中
            const otherRoom = findUserInRoom(data.user.uid);
            if (otherRoom && otherRoom.roomId !== data.roomId) {
                // if (otherRoom[0].game && otherRoom[0].game.gameState.find(u => u.uid === data.user.uid)){
                //     if (!otherRoom[0].game.gameState.find(u => u.uid === data.user.uid).offLine) {

                //     }
                // }
                setTimeout(() => {
                    //console.log(`您已经在房间:${otherRoom.roomId}中，不能加入其他房间"}`);
                    //scoket.emit('message', `{"type":"errorInfo","content":"对不起，您已经在其他房间（单局游戏中），单局结束之前不允许加入其他房间"}`);
                    //console.log(otherRoom);
                    scoket.emit('message', `{"type":"errorInfo","order":"jump","content":"您已经在其他房间中（游戏中），单局完成之前暂不能加入其他房间，请完成单局游戏后再加入，谢谢（确定自动跳转至未完成游戏）"}`);
                }, 200);
                return;
            }
            //const _rooms = global.allRooms.filter(item => item.roomId + '' === data.roomId);
            const _rooms = getRoom(data.roomId);
            data.user.name = decodeURI(data.user.name);
            if (_rooms) {
                //走加入流程
                let room = _rooms;
                const theGamer = room.gamers.find(gamer => gamer.uid === data.user.uid);
                const isInRoom = theGamer ? true : false;
                //data.user['catcher'] = false;
                data.user['offLine'] = false;
                scoket.user = data.user;
                if (theGamer) theGamer['offLine'] = false;
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
                    console.log('(' + (new Date()).toLocaleString() + ')' + data.user.name + '加入房间房间ID:' + room.roomId);
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
                const reg = () => {
                    room.game.regAction().forEach(item => {
                        scoket.on(item.actionName, function (data) {
                            item.actionFn.call(room.game, data);
                        })
                    });
                }
                let loopCount = 0;
                if (room.game) {
                    reg();
                } else {
                    //两个页面同时打开，建房还没有初始化game，第二个又来注册，就会出问题，这里给个时针，有房间了才注册（最多执行10次）
                    const timer = setInterval(() => {
                        if (loopCount === 10) {
                            clearInterval(timer);
                            setTimeout(() => {
                                scoket.emit('message', `{"type":"errorInfo","content":"对不起，游戏初始化出现错误，请重试..."}`);
                            }, 1000);
                            console.log('加入房间游戏初始化失败...');
                        } else {
                            if (room.game) {
                                reg();
                                clearInterval(timer);
                            } else {
                                loopCount++;
                            }
                        }
                    }, 200);
                }
                sqliteCommon.updateState({
                    roomId: data.roomId,
                    state: 1
                }, () => { }, (error) => {
                    writeLog('API updateRoomState error', error);
                });
            } else {
                //走建房流程
                //找到房间后先更新房间状态为1（已激活）
                //console.log('getOne begin:' + data.roomId);
                sqliteCommon.getOne({
                    roomId: data.roomId
                }, (result) => {
                    //console.log('getOne done');
                    if (!result.checkiner || !data.user.uid) {
                        //consoleconsole.log('result.checkiner：' + result.checkiner);
                        //console.log('data.user.uid：' + data.user.uid);
                        setTimeout(() => {
                            scoket.emit('message', `{"type":"errorInfo","content":"对不起，用户初始化错误，请重试..."}`);
                        }, 2000);
                    } else {
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
                            //由于这里是异步，如果同时两个人checkIn的时候，可能都会到这一步，那么就会建立两个一样的房间，所以这里需要判断
                            if (global.allRooms.find(r => r.roomId === data.roomId)) {
                                checkin(data);
                                return;
                            }
                            //开始初始化room到内存
                            const jsonData = JSON.parse(result.jsonData);
                            data.user.point = 0;
                            data.user.state = 'wait';
                            data.user['offLine'] = false;
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
                            global.allRooms.push(room);
                            //data.user['catcher'] = true;
                            scoket.user = data.user;

                            console.log('(' + (new Date()).toLocaleString() + ')' + data.user.name + '开房成功，房间ID:' + room.roomId);
                            if (!room.game) {
                                console.log('建立房间游戏初始化失败...');
                                setTimeout(() => {
                                    scoket.emit('message', `{"type":"errorInfo","content":"对不起，游戏初始化失败，请稍候..."}`);
                                }, 2000);
                                return;
                            }
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
                        }, (error) => {
                            writeLog('API updateState22 error', error);
                        });
                    }
                }, (error) => {
                    writeLog('API getOne error', error);
                });

            }
        } catch (e) {
            writeLog('checkin', e);
        }
    }
    const disconnect = () => {
        try {
            if (!scoket.user) return;
            const room = findUserInRoom(scoket.user.uid);
            if (room) {
                const gamer = room.gamers.find(g => g.uid === scoket.user.uid);
                gamer['offLine'] = true;
                if (room.state === 'playing') {
                    //正在进行的游戏
                    //room.game.regAction(scoket, this);
                    setTimeout(() => {
                        sendForRoom(room.roomId, `{"type":"roomData","content":${JSON.stringify(room.getSimplyData())}}`);
                    }, 50);
                } else {
                    room.gamerLeave(scoket.user.uid);
                    if (room.gamers.length === 0) {
                        const _room = global.allRooms.find(room => room.roomId === room.roomId);
                        _room.game.timer.end();

                        //如果人全部都离开了，清除room数据
                        // const _room = global.allRooms.find(room => room.roomId === room.roomId);
                        // if (_room && _room.game) {
                        //     _room.game.timer.end();
                        //     _room.game = null;
                        // }
                        // global.allRooms = global.allRooms.filter(_room => _room.id !== room.roomId);
                        // console.log(`玩家退完，清除房间数据:${room.roomId}"}`);
                    } else {
                        setTimeout(() => {
                            //console.log(`{"type":"notified","content":"${scoket.user.name}离开了房间ID:${room.roomId}"}`);
                            sendForRoom(room.roomId, `{"type":"notified","content":"${scoket.user.name}离开了房间"}`);
                            sendForRoom(room.roomId, `{"type":"roomData","content":${JSON.stringify(room.getSimplyData())}}`);
                        }, 50);
                    }

                    // room.gamerLeave(scoket.user.uid);
                    // sendForRoom(room.roomId, `{"type":"notified","content":"${scoket.user.name}离开了房间"}`);
                    // sendForRoom(room.roomId, `{"type":"roomData","content":${JSON.stringify(room.getSimplyData())}}`);
                }
            }
        } catch (error) {
            writeLog('disconnect', error);
        }
    }
    return {
        connection: (scoket) => {
            //console.log('接入链接-------------------------scoket.id ' + scoket.id);
            if (!scoket.user) return;
            const resultRoom = findUserInRoom(scoket.user.uid);
            if (resultRoom) {
                let gamer = resultRoom.gamer.find(g => g.uid === data.uid);
                gamer['offLine'] = false;
                setTimeout(() => {
                    sendForRoom(data.roomId, `{"type":"roomData","content":${JSON.stringify(resultRoom.getSimplyData())}}`);
                }, 100);
                if (resultRoom.game && !resultRoom.game.isOver) {
                    resultRoom.game.regAction().forEach(item => {
                        scoket.on(item.actionName, function (data) {
                            item.actionFn.call(resultRoom.game, data);
                        })
                    });
                    setTimeout(() => {
                        resultRoom.game.sendData();
                    }, 200);
                }
            }
            // resultRooms.forEach(room => {
            //     //设置为offline
            //     const state = room.game.gameState.find(state => state.uid === data.uid);
            //     state['offLine'] = false;
            //     //room.gamerLeave(data.uid);
            // })
        },
        disconnect: disconnect,
        reconnectting: (data) => {
            data.user.name = decodeURI(data.user.name);
            scoket.user = data.user;
            //const room = findUserInRoom(data.user.uid);
            const room = global.allRooms.find(r => r.roomId === data.roomId);
            if (room) {
                let gamer = room.gamers.find(g => g.uid === data.user.uid);
                if (gamer) gamer['offLine'] = false;

                if (room.gamers.length === room.gamerNumber) {
                    //setTimeout(() => { sendForUser(data.user.uid, `{"type":"errorInfo","content":"对不起，房间人数已满~"}`); }, 2000);
                    setTimeout(() => {
                        sendForRoom(data.roomId, `{"type":"roomData","content":${JSON.stringify(room.getSimplyData())}}`);
                    }, 100);
                } else {
                    //加入
                    room.gamerJoin(data.user);
                    setTimeout(() => {
                        sendForRoom(data.roomId, `{"type":"roomData","content":${JSON.stringify(room.getSimplyData())}}`);
                        setTimeout(() => {
                            sendForRoom(data.roomId, `{"type":"notified","content":"${decodeURI(data.user.name)}加入房间"}`);
                        }, 50);
                    }, 1000);
                }
                if (room.game && !room.game.isOver) {
                    room.game.regAction().forEach(item => {
                        scoket.on(item.actionName, function (data) {
                            item.actionFn.call(room.game, data);
                        })
                    });
                    setTimeout(() => {
                        room.game.sendData();
                    }, 1000);
                }
            }

        },
        findUserInRoom: () => {
            findUserInRoom();
        },
        checkin: checkin,
        ready: (data) => {
            try {
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
                    if (room.allTime === room.gameTime + 1) {
                        //第一次开始，使用begin（避免两次初始化game））
                        room.begin(scoket, sendForRoom, sendForUser);
                    } else {
                        room.singleGameBegin();
                    }
                } else {
                    if (room.game && room.game.isOver) {
                        sendForUser(data.user.uid, `{"type":"gameData","content":""} `);//重置gameData
                    }
                }
                //准备时更新下活动状态（主要更新最后活跃时间）
                sqliteCommon.updateState({ roomId: data.roomId, state: 1 }, () => { }, (error) => {
                    writeLog('API updateRoomState error', error);
                });
                setTimeout(() => {
                    //sendForUser(data.user.uid, `{"type":"notified","content":"${data.user.name}成功开房间ID:${room.roomId}"}`);
                    sendForRoom(room.roomId, `{"type":"roomData","content":${JSON.stringify(room.getSimplyData())}}`);
                }, 50);
            } catch (e) {
                writeLog('ready', e);
            }
        },
        heartBeat: (data) => {
            const room = global.allRooms.find(r => r.roomId === data.roomId);
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
                    name: decodeURI(data.name),
                    content: data.content
                })}}`);
            }, 50);
        },
        ack: (data) => {
            msgExplorer.msgAck(data);
        },
        exit: (data) => {
            // const resultRooms = findUserInRoom(data.uid);
            // resultRooms.forEach(room => {
            //     //设置为offline
            //     if (room.state === 'playing' && room.game) {
            //         const state = room.game.gameState.find(state => state.uid === data.uid);
            //         state['offLine'] = true;
            //     } else {
            //         room.gamerLeave(scoket.user.uid);
            //     }
            //     //room.gamerLeave(data.uid);
            // });
            disconnect();
        }
    }
}