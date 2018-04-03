const UUID = require('../util/UUID');
const Majiang = require('./majiang');
const clone = require('clone');

class Room {
    constructor(option) {
        const _option = Object.assign({
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
            state: 'wait',//wait、playing、end,
            recode: [],
            gameType: 'majiang',//‘jinhua’
            game: {},//正在进行的游戏
        }, option);
        Object.keys(_option).forEach((item) => {
            this[item] = _option[item];
        });
        let self = this;
        this.gameType = "majiang";
        this.game = new Majiang();
        this.game.setSendMsg(function (content) {
            //监听游戏发出的任何信息
            self.sendMsg && self.sendMsg(content);
        })
        this.game.setOverHander(function () {
            //监听单局游戏结束，进入下一局
            if (self.gameTime > 0) {
                //单局开始
                self.gameTime--;
                self.state = 'playing';
                self.singleGameBegin();
            } else {
                self.state = 'end';
                self.end();//所有局数结束，房间结束
            }
        });
    }
    getSimplyData() {
        const dataClone = clone(this);
        delete dataClone.game;
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
        const roomState = 'playing';
        const self = this;
        this.gamers.forEach((gamer) => {
            if (gamer.uid === uid) gamer.state = state;
            //if (gamer.state === 'wait' && roomState === 'playing') roomState = 'wait';
        });
    }
    singleGameBegin(scoket) {
        const self = this;
        //注册游戏客户端动作
        //game.regAction(scoket, this);
        this.game.init(this.gamers.map(gamer => { return { uid: gamer.uid } }));
        this.game.assignCard();//分发牌
    }
    begin(scoket) {
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