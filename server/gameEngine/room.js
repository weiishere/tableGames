const UUID = require('../util/UUID');
const Majiang = require('./majiang');
const clone = require('clone');

class Room {
    constructor(option) {
        this.optionSet = Object.assign({
            roomId: 1,//(new UUID()).generateUUID(),
            gamers: [
                {
                    uid: 1,
                    name: '葛大爷',
                    avatar: '',
                    point: 1000,
                    state: 'wait'//ready
                },
                {
                    uid: 2,
                    name: '董卓',
                    avatar: '',
                    point: 1000,
                    state: 'wait'//ready
                }
            ],//玩家
            gamerNumber: 4,
            mulriple: 1,//倍数
            score: 100,//底分
            gameTime: 4,
            state: 'wait',//wait、playing、next、end,
            recode: [],
            gameType: 'majiang',//‘jinhua’
            game: {},//正在进行的游戏
        }, option);
        this.allTime = this.gameTime = this.optionSet.gameTime;//可以玩的次数，备份下，用于显示
        Object.keys(this.optionSet).forEach((item) => {
            this[item] = this.optionSet[item];
        });
        this.initGame();
    }
    initGame() {
        const self = this;
        this.gameType = "majiang";
        this.game = new Majiang({ colorType: this.optionSet.colorType });
        this.game.setSendMsg(function (content) {
            //监听游戏发出的任何信息
            self.sendMsg && self.sendMsg(content);
        })
        this.game.setOverHander(function () {
            //监听单局游戏结束，进入下一局
            if (self.gameTime > 0) {
                //单局开始
                self.state = 'wait';
                self.gamers.forEach((gamer) => { gamer.state = 'wait'; });
                self.gameTime--;
                //发送房间信息
                self.sendForRoom(self.roomId, `{"type":"roomData","content":${JSON.stringify(self.getSimplyData())}}`);
                //self.state = 'playing';
                //self.singleGameBegin();
            } else {
                self.state = 'end';
                self.end();//所有局数结束，房间结束
            }
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
        this.game.init(this.gamers.map((gamer, index) => { return { uid: gamer.uid, catcher: index === 0 ? true : false } }));
        this.game.assignCard();//分发牌
    }
    begin(scoket, sendForRoom, sendForUser) {
        const self = this;
        this.sendForRoom = sendForRoom;
        this.sendForUser = sendForUser;
        this.setSendMsg(function (content) {
            //sendForRoom(data.roomId, `{"type":"gameData","content":${JSON.stringify(content)}}`);
            self.gamers.forEach(gamer => {
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
                    remainCardNumber: content.remainCardNumber,
                    isOver: (content.isOver ? true : false)
                }
                sendForUser(gamer.uid, `{"type":"gameData","content":${JSON.stringify(_data)}} `);
            });
        })
        this.singleGameBegin(scoket);
        //this.gameStart();
    }
    //全部局数结束
    end() {
        this.state = 'end';
        this.endHandler && this.endHandler();
    }
    //单局结算
    settlement(result) {
        // const _result = [
        //     { uid: 1, niceName: 'userName1', increase: 100 * this.mulriple },
        //     { uid: 2, niceName: 'userName2', increase: -200 * this.mulriple },
        //     { uid: 3, niceName: 'userName3', increase: 400 * this.mulriple },
        //     { uid: 4, niceName: 'userName4', increase: -300 * this.mulriple }
        // ]
        this.recode += result;
        this.gamers.forEach((gamer) => {
            this.result.forEach((_result) => {
                if (gamer.uid === _result.uid) {
                    gamer.point += _result.increase;
                }
            });
        });
    }
    setSendMsg(fn) {
        this.sendMsg = fn;
    }
    setEnd(fn) {
        this.endHandler = fn;
    }
}
module.exports = Room;