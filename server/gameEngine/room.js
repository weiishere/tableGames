const UUID = require('../util/UUID');

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
            recode: []
        }, option);
        Object.keys(_option).forEach((item) => {
            this[item] = _option[item];
        });
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
    begin() {
        //this.gameStart();
    }
    //全部局数结束
    end() {
        this.state = 'end';
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
}
module.exports = Room;