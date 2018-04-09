const getRedom = require('../../util/redom');
const UUID = require('../../util/uuid');
const winCore = require('./winCore');
const clone = require('clone');

//用于对牌组排序
const objectArraySort = function (keyName) {
    return function (objectN, objectM) {
        var valueN = objectN[keyName]
        var valueM = objectM[keyName]
        if (valueN < valueM) return -1
        else if (valueN > valueM) return 1
        else return 0
    }
}
class Majiang {
    constructor(option) {
        const _option = Object.assign({
            gameId: (new UUID()).generateUUID(),
            gameState: [{ uid: '1' }, { uid: '2' }, { uid: '3' }, { uid: '4' }],
            // gameState: [
            //     { uid: '1', increase: 0, cards: [], groupCards: [] },
            //     { uid: '2', increase: 0, cards: [], groupCards: [] },
            //     { uid: '3', increase: 0, cards: [], groupCards: [] },
            //     { uid: '4', increase: 0, cards: [], groupCards: [] }
            // ],
        }, option || {});
        Object.keys(_option).forEach((item) => {
            this[item] = _option[item];
        });
        this.cards = [];
        this.lastShowCard = undefined;
    }
    init(gameState) {
        //需要为state做一个排序，用于之后顺序摸牌
        this.gameState = gameState.map(state => {
            return {
                uid: state.uid,
                increase: 0,
                cards: [],
                colorLack: '',//缺的花色
                outCards: [],
                actionCode: [],//动作提示
                fatchCard: undefined,
                groupCards: {
                    meet: [],//二维数组
                    fullMeet: []//二维数组
                },
                catcher: state.catcher
            }
        }).sort(function (a, b) {
            return +a.uid - +b.uid;
        });
        const cardColors = ['b', 't', 'w'], _cards = [],
            getRedomCard = () => {
                //const cardsLength = _cards.length;
                const redom = getRedom(0, _cards.length - 1);
                const card = _cards.splice(redom, 1)[0];
                this.cards.push(card);
                if (_cards.length != 0) getRedomCard();
            };
        cardColors.forEach(cardColor => {
            for (let i = 1; i <= 9; i++) {
                for (let j = 1; j <= 4; j++) {
                    //根据图片的样子，前6个按照2.7/3.8单位走，后3个换行
                    _cards.push({ key: `card-${cardColor}-${i}-${j}`, color: cardColor, number: i });
                }
            }
        });
        const _length = _cards.length;
        getRedomCard();
    }
    //获取指定的牌（主要用于快速获取牌型用于测试）
    getSpecifiedCard(color, number) {
        for (let i = 0, l = this.cards.length; i < l; i++) {
            if (this.cards[i].color === color && this.cards[i].number === number) {
                const card = this.cards.splice(i, 1)[0];
                return card;
            }
        }
    }
    concatCard(state, isGroup) {
        //返回所有牌的组合(排序后的)
        let allCards = [];
        allCards = allCards.concat(state.cards);
        state.groupCards.meet.forEach(meetArr => {
            allCards = allCards.concat(meetArr);
        })
        state.groupCards.fullMeet.forEach(meetArr => {
            allCards = allCards.concat(meetArr);
        })
        return allCards.sort(objectArraySort('key'));
    }
    //【核心算法函数】处理牌桌子上的各种情况，返回是否暂停，并发送消息
    doGameState(uid, showCrad, from) {
        const gameStates = (from === 'other' ? this.gameState.filter(item => item.uid !== uid) : this.gameState.filter(item => item.uid === uid));
        let result = false;
        //let isOtherPass = false;
        gameStates.forEach(userState => {
            //如果某玩家有碰或者杠，那么其他玩家也可能胡牌，所以其他玩家每个人都要计算
            userState.actionCode = [];//首先清空动作代码
            //如果对比的是自己要定缺的牌色，不予继续
            if (showCrad.color === userState.colorLack) { return false; }
            //let _concatCard = this.concatCard(userState);
            const alikeCount = userState.cards.filter(card => card.color === showCrad.color && card.number === showCrad.number).length;
            if (from === 'other' && alikeCount === 2) {
                userState.actionCode.push('meet');//有碰(自己的话不能碰)
            } else if (alikeCount === 3) {
                userState.actionCode.push('fullMeet');//有杠
                if (from === 'other') userState.actionCode.push('meet');//别人打的牌，如果有杠，当然也可以选择碰
            }
            //计算胡牌
            const _cards = userState.cards.concat(showCrad).sort(objectArraySort('key'));
            if (winCore(_cards)) {
                userState.actionCode.push('winning');//有胡牌
            }
            if (userState.actionCode.length !== 0 && !result) {
                result = true;
            }
        });
        return result;
    }
    regAction(socket) {
        const self = this;
        socket.on('showCard', function (_data) {
            const data = JSON.parse(_data);
            const userState = self.gameState.find(item => item.uid === data.uid);
            let showCard;
            if (userState.fatchCard && userState.fatchCard.key === data.cardKey) {
                //直接打出了刚刚摸的牌
                showCard = userState.fatchCard;
                userState.outCards.push(clone(userState.fatchCard));
                //userState.fatchCard = undefined;
            } else {
                showCard = userState.cards.find(item => item.key === data.cardKey);
                userState.outCards.push(showCard);
                userState.cards = userState.cards.filter(item => item.key !== data.cardKey);
                //fatchCard可能为空（碰了之后不会摸牌）
                userState.fatchCard && userState.cards.push(clone(userState.fatchCard));
                userState.cards = userState.cards.sort(objectArraySort('key'));
                //userState.fatchCard = undefined;
            }
            //判断是否需要暂停
            if (!self.doGameState(data.uid, showCard, 'other')) {
                //无须暂定，下一个玩家抓牌
                let nextCatcher, _l = self.gameState.length, catcher = self.gameState.filter(item => item.catcher === true)[0];
                self.gameState.forEach((userState, index) => {
                    if (userState.catcher) {
                        if (index + 1 === _l) {
                            //已经是最后一个
                            nextCatcher = self.gameState[0];
                        } else {
                            nextCatcher = self.gameState[index + 1];
                        }
                    }
                })
                nextCatcher.catcher = true;
                catcher.catcher = false;
                self.fatchCard();//发牌
            } else {
                //暂停，等待玩家做出动作，有动作的话
            }
            self.lastShowCard = showCard;
            userState.fatchCard = undefined;//清空玩家刚刚抓到的牌
            self.sendData();
        });
        socket.on('chooseColor', function (_data) {
            const data = JSON.parse(_data);
            const userState = self.gameState.filter(item => item.uid === data.uid)[0];
            userState.colorLack = data.color;
            self.sendData();
            setTimeout(() => {
                if (self.gameState.filter(item => item.colorLack === '').length === 0) {
                    //如果所有人都选择了花色，那么开始发牌（庄家会接收）
                    self.fatchCard();
                    self.sendData();
                }
            }, 100);
        });
        socket.on('action', function (_data) {
            const data = JSON.parse(_data);
            const userState = self.gameState.find(item => item.uid === data.uid);
            const showCardGamerState = self.gameState.find(item => item.catcher === true);
            if (data.actionType === 'pass') {
                self.fatchCard();//下一个人摸牌
            } else {
                //首先看是自己摸的牌还是别人打的，判断自己的fatchCard是否为空，如果是别人打的，要取得这张牌
                let isMineAction = userState.fatchCard ? true : false;
                const doCard = isMineAction ? clone(userState.fatchCard) : clone(self.lastShowCard);//需要处理的入参牌
                if (data.actionType === 'meet' && !isMineAction) {
                    //按照之前的逻辑，自己的牌，应该不会出现碰，这里再判断一下
                    let count = 0;//只能取两张（可能玩家手上有3张符合的牌）
                    let _meet = [doCard];
                    userState.cards = userState.cards.filter(card => {
                        if (card.color === doCard.color && card.number === doCard.number && count < 2) {
                            count++;
                            _meet.push(card);
                            return false;
                        } else {
                            return true;
                        }
                    });
                    userState.groupCards.meet.push(_meet);
                    showCardGamerState.catcher = false;
                    userState.catcher = true;//把自己设置为下一个出牌的人
                } else if (data.actionType === 'fullMeet') {
                    let _fulMmeet = [doCard];
                    userState.cards = userState.cards.filter(card => {
                        if (card.color === doCard.color && card.number === doCard.number) {
                            _fulMmeet.push(card);
                            return false;
                        } else {
                            return true;
                        }
                    });
                    userState.groupCards.fullMeet.push(_fulMmeet);
                    showCardGamerState.catcher = false;
                    userState.catcher = true;//把自己设置为下一个出牌的人
                    self.fatchCard(data.uid);//自己再摸一张牌
                } else if (data.actionType === 'winning') {

                }
                //如果是自己摸的牌，因为已经clone了，这里要处理掉
                userState.fatchCard = undefined;//其实之后还是会统一处理掉，放这里为了好理解
                //如果是别人打的牌，需要置空outCards里的那张牌
                showCardGamerState.outCards = showCardGamerState.outCards.filter(card => card.key !== doCard.key);
            }
            userState.actionCode = [];
            self.sendData();
        })
    }
    sendData() {
        this.sendMsgHandler({
            gameState: this.gameState,
            remainCardNumber: this.cards.length,
            lastShowCard: this.lastShowCard
        });
    }
    //发牌，同时也就开始游戏了
    assignCard(callback) {
        // this.gameState.forEach(userState => {
        //     userState.cards = this.cards.splice(0, 13).sort(objectArraySort('key'));
        // });
        //获取指定的牌，主要还是快速调试
        this.gameState[0].cards = [
            this.getSpecifiedCard('t', 1), this.getSpecifiedCard('t', 2), this.getSpecifiedCard('t', 3),
            this.getSpecifiedCard('t', 4), this.getSpecifiedCard('t', 5), this.getSpecifiedCard('t', 6),
            this.getSpecifiedCard('w', 1), this.getSpecifiedCard('w', 1), this.getSpecifiedCard('w', 1),
            this.getSpecifiedCard('w', 2), this.getSpecifiedCard('w', 2), this.getSpecifiedCard('w', 3), this.getSpecifiedCard('t', 4)
        ].sort(objectArraySort('key'));
        this.gameState[1].cards = [
            this.getSpecifiedCard('t', 4), this.getSpecifiedCard('t', 4), this.getSpecifiedCard('t', 5),
            this.getSpecifiedCard('t', 5), this.getSpecifiedCard('t', 6), this.getSpecifiedCard('t', 6),
            this.getSpecifiedCard('w', 5), this.getSpecifiedCard('w', 5), this.getSpecifiedCard('w', 5),
            this.getSpecifiedCard('w', 7), this.getSpecifiedCard('w', 7), this.getSpecifiedCard('w', 8), this.getSpecifiedCard('w', 1)
        ].sort(objectArraySort('key'));
        this.sendData();
    }
    //抓牌
    fatchCard(uid) {
        const _uid = !uid ? this.gameState.filter(item => item.catcher === true)[0].uid : uid;
        if (this.cards.length === 0) {
            //如果总牌数为0了，则结束游戏
            this.overHandler.call(this);
            return false;
        }
        const userState = this.gameState.filter(item => item.uid === _uid)[0];
        const cardByCatch = this.cards.splice(0, 1)[0];
        userState.fatchCard = cardByCatch;
        //判断用户拿到牌之后是否需要用户做出其他选择(胡牌、杠)
        if (!this.doGameState(_uid, cardByCatch, 'self')) {
            //没有需要处理的动作
        } else {
            //有动作
        }
        return cardByCatch;
    }
    //出牌
    // showCard(uid, card) {
    //     const state = this.gameState.filter(item => item.uid === uid)[0];
    //     state.cards = state.cards.filter(item => item.key != card.key);
    //     this.outCards.push(state.cards.filter(item => item.key === card.key)[0]);
    // }
    setBegin(fn) {
        this.beginHandler = fn;
    }
    setOverHander(fn) {
        this.overHandler = fn;
    }
    setSendMsg(fn) {
        this.sendMsgHandler = fn;
    }
}
module.exports = Majiang;