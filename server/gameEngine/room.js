const UUID = require('../util/uuid');
const Majiang = require('./majiang');
const clone = require('clone');
const writeLog = require('../util/errorLog');
const sqliteCommon = require('../sqliteCommon');

class Room {
    constructor(option) {
        this.optionSet = Object.assign({
            roomId: 1,//(new UUID()).generateUUID(),
            gamers: [],
            gamerNumber: 4,
            mulriple: 1,//倍数
            score: 100,//底分
            gameTime: 4,
            state: 'wait',//wait、playing、next、end,
            recode: [],
            gameType: 'majiang',//‘jinhua’
            game: {},//正在进行的游戏
            rule: 'chengdu'
        }, option);
        this.allTime = this.gameTime = this.optionSet.gameTime;//可以玩的次数，备份下，用于显示
        Object.keys(this.optionSet).forEach((item) => {
            this[item] = this.optionSet[item];
        });
        this.checkinTime = Date.now();
        this.gameTime--;
        this.initGame();
    }
    initGame() {
        const self = this;
        this.gameType = "majiang";
        //获取庄家
        let gamerMaster;
        if (this.recode.length !== 0) {
            let _uid;
            for (let i; i < this.recode.length; i++) {
                if (this.recode[i].master) {
                    _uid = this.recode[i].uid;
                    break;
                }
            }
            if (_uid) {
                gamerMaster = this.gamer.find(item => item.id === _uid);
            } else {
                gamerMaster = this.gamers[0];
            }
        } else {
            gamerMaster = this.gamers[0];//第一局的话，第一个加入的人是庄家
        }

        this.game = new Majiang({ colorType: this.optionSet.colorType, master: gamerMaster, rule: this.optionSet.rule });//庄家，上一次第一次胡牌的玩家
        this.game.setSendMsg(function (content, uid) {
            //监听游戏发出的任何信息
            self.sendMsg && self.sendMsg(content, uid);
        })
        this.game.setOverHander(function () {
            //监听单局游戏结束，进入下一局
            self.game.isOver = true;
            self.settlement();
            if (self.gameTime > 0) {
                //单局开始
                self.gameTime--;
                self.state = 'wait';
                self.gamers.forEach((gamer) => { gamer.state = 'wait'; });
                //self.state = 'playing';
                //self.singleGameBegin();
            } else {
                self.state = 'end';
                self.end();//所有局数结束，房间结束
            }
            //发送房间信息
            self.sendForRoom(self.roomId, `{"type":"roomData","content":${JSON.stringify(self.getSimplyData())}}`);
        });
    }
    getSimplyData() {
        const dataClone = clone(this);
        delete dataClone.game;
        delete dataClone.optionSet;
        return dataClone;
    }
    gamerJoin(user) {
        if (this.gamers.length < this.gamerNumber) {
            this.gamers.push(user);
            // this.gamers = this.gamers.sort(function (a, b) {
            //     return +a.uid - +b.uid;
            // });
            return true;
        } else {
            //拒绝加入
            return false;
        }
    }
    gamerLeave(uid) {
        this.gamers = this.gamers.filter(gamer => gamer.uid != uid);
    }
    setRoomState(state) {
        this.state = state
    }
    setUserState(uid, state) {
        //const roomState = 'playing';
        const self = this;
        this.gamers.forEach((gamer) => {
            if (gamer.uid === uid) gamer.state = state;
        });
    }
    singleGameBegin(scoket) {
        const self = this;
        //注册游戏客户端动作
        //game.regAction(scoket, this);
        //默认第一个用户是庄家
        this.initGame();
        this.game.init(this.gamers.map((gamer, index) => { return { uid: gamer.uid, name: gamer.name, catcher: false } }));
        this.game.assignCard();//分发牌
    }
    begin(scoket, sendForRoom, sendForUser) {
        try {
            const self = this;
            this.setSendMsg(function (content, uid) {
                //sendForRoom(data.roomId, `{"type":"gameData","content":${JSON.stringify(content)}}`);
                self.gamers.forEach(gamer => {
                    const _data = {
                        gameState: (() => {
                            let result = new Object(), l = content.gameState.length;
                            for (let i = 0; i < l; i++) {
                                const userState = content.gameState[i];
                                result['user_' + userState.uid] = clone(userState);
                                if (userState.uid !== gamer.uid) {
                                    if (content.isOver) {
                                        result['user_' + userState.uid].cards = userState.cards;
                                    } else {
                                        result['user_' + userState.uid].cards = userState.cards.length;
                                    }

                                }
                            }
                            return result;
                        })(),
                        lastShowCard: content.lastShowCard,
                        remainCardNumber: content.remainCardNumber,
                        isOver: (content.isOver ? true : false)
                    }
                    if (uid) {
                        if (gamer.uid === uid) {
                            sendForUser(gamer.uid, `{"type":"gameData","content":${JSON.stringify(_data)}} `);
                        }
                    } else {
                        sendForUser(gamer.uid, `{"type":"gameData","content":${JSON.stringify(_data)}} `);
                    }

                });
            })
            this.singleGameBegin(scoket);
            this.sendForRoom = this.game.sendForRoom = sendForRoom;
            this.sendForUser = this.game.sendForUser = sendForUser;
        } catch (e) {
            writeLog('begin', e);
        }
        //this.gameStart();
    }
    //全部局数结束
    end() {
        //结束时更新下房间状态
        sqliteCommon.updateState({ roomId: this.roomId, state: 2 });
        this.state = 'end';
        this.endHandler && this.endHandler();
    }
    //单局结算
    settlement() {
        // const _result = [
        //     { uid: 1, niceName: 'userName1', increase: 100 * this.mulriple },
        //     { uid: 2, niceName: 'userName2', increase: -200 * this.mulriple },
        //     { uid: 3, niceName: 'userName3', increase: 400 * this.mulriple },
        //     { uid: 4, niceName: 'userName4', increase: -300 * this.mulriple }
        // ]
        // this.recode += result;
        // this.gamers.forEach((gamer) => {
        //     this.result.forEach((_result) => {
        //         if (gamer.uid === _result.uid) {
        //             gamer.point += _result.increase;
        //         }
        //     });
        // });
        this.recode.push(this.game.gameState.map(item => {
            return {
                uid: item.uid,
                name: item.name,
                point: item.point,
                winDesc: item.winDesc,
                master: item.master
            }
        }));
    }
    setSendMsg(fn) {
        this.sendMsg = fn;
    }
    setEnd(fn) {
        this.endHandler = fn;
    }
}
module.exports = Room;