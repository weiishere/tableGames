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
        //this.colorType = 3;
        this.cards = [];
        this.lastShowCardUserState = null;
        this.lastShowCard = undefined;
        this.isOver = false;
    }
    init(gameState) {
        //需要为state做一个排序，用于之后顺序摸牌(不排了)
        this.gameState = gameState.map(state => {
            return {
                uid: state.uid,
                name: state.name,
                isWin: false,
                point: 0,
                cards: [],
                colorLack: this.colorType === 2 ? 'b' : '',//缺的花色(如果是两黄牌的话，就直接缺b)
                outCards: [],
                actionCode: [],//动作提示
                fatchCard: undefined,
                groupCards: {
                    meet: [],//二维数组
                    fullMeet: [],//二维数组
                    winCard: undefined,//{ key: 'test', color: 't', number: 3 }
                },
                catcher: state.catcher
            }
        })
        // .sort(function (a, b) {
        //     return +a.uid - +b.uid;
        // });
        const cardColors = ['t', 'w', 'b'].splice(0, this.colorType), _cards = [],
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
        this.lastShowCardUserState = this.gameState.find(item => item.catcher === true);//默认是第一个人
        getRedomCard();
    }
    //根据当前玩家获取到下一个取牌的玩家（不能根据上次抓牌的玩家，因为碰杠胡都可能会打乱顺序）
    getNaxtCacher(thisUid) {
        const remainState = !thisUid ? this.gameState.filter(state => state.isWin === false) : this.gameState.filter(state => state.isWin === false || state.uid === thisUid)
        //未胡牌的玩家（如果指定了是谁之后，那么这个人也可能是赢家，那么不能排除，不然找不到起始对象）
        let nextCatcher, nextIndex = 0, _l = remainState.length;
        //thisGamer = remainState.find(item => item.uid === thisUid);
        //this.lastShowCardUserState = thisGamer;//本次出牌人或者本次操作了的人
        remainState.forEach((userState, index) => {
            if (userState.uid === thisUid) {
                if (index + 1 === _l) {
                    //已经是最后一个
                    nextCatcher = remainState[0];
                } else {
                    nextCatcher = remainState[index + 1];
                    nextIndex = index + 1;
                }
            }
        });
        return nextCatcher;
    }
    setGamerCacher(state = { uid: 0 }) {
        //state为空的话，意思所有人catcher都设置为false，主要为遇到了有动作的时候
        this.gameState.forEach(item => {
            if (item.uid !== state.uid) {
                item.catcher = false;
            } else {
                item.catcher = true;
            }
        })
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
        const gameStates = (from === 'other' ? this.gameState.filter(item => item.uid !== uid && !item.isWin) : this.gameState.filter(item => item.uid === uid));
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
                if (from === 'other') {
                    userState.actionCode.push('meet');//别人打的牌，如果有杠，当然也可以选择碰
                }
            }
            //判断是否有碰的碰牌加杠
            if (from === 'self') {
                userState.groupCards.meet.forEach(_meet => {
                    if (_meet[0].color === showCrad.color && _meet[0].number === showCrad.number) {
                        userState.actionCode.push('fullMeet');//自己摸的牌杠
                    }
                })
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
    castAccounts(winner, loser, score) {
        if (loser === 'all') {
            this.gameState.forEach(state => {
                if (state.uid !== winner.uid && !state.isWin) {
                    winner.point += score;
                    state.point -= score;
                }
            })
        } else {
            winner.point += score;
            loser.point -= score;
        }
    }
    regAction() {
        return [
            {
                actionName: 'showCard',
                actionFn: function (_data) {
                    const data = JSON.parse(_data);
                    const userState = this.gameState.find(item => item.uid === data.uid);
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
                    this.lastShowCardUserState = userState;
                    // const remainState = this.gameState.filter(state => state.isWin === false);//未胡牌的玩家
                    // let nextCatcher, nextIndex = 0, _l = remainState.length, catcherGamer = remainState.find(item => item.catcher === true);
                    // this.lastShowCardUserState = catcherGamer;//上次出牌人
                    // remainState.forEach((userState, index) => {
                    //     if (userState.catcher) {
                    //         if (index + 1 === _l) {
                    //             //已经是最后一个
                    //             nextCatcher = remainState[0];
                    //         } else {
                    //             nextCatcher = remainState[index + 1];
                    //             nextIndex = index + 1;
                    //         }
                    //     }
                    // });
                    // catcherGamer.catcher = false;
                    // nextCatcher.catcher = true;
                    //判断是否需要暂停
                    if (!this.doGameState(data.uid, showCard, 'other')) {
                        //无须暂定，下一个玩家抓牌
                        //this.setGamerCacher(nextCatcher);
                        const next = this.getNaxtCacher(userState.uid);
                        this.setGamerCacher(next);
                        if (this.cards.length === 0) {
                            //如果总牌数为0了，则结束游戏
                            this.overHandler.call(this);
                        }else{
                            this.fatchCard();//发牌
                        }
                    } else {
                        this.setGamerCacher();//都设置为false
                        //暂停，等待玩家做出动作，有动作的话
                        let winners = this.gameState.filter(item => item.actionCode.indexOf('winning') !== -1);
                        if (winners.length !== 0) {
                            //说明有玩家有胡牌，那么需要暂时禁用掉其他有动作玩家的非胡牌操作
                            let others = this.gameState.filter(item => item.actionCode.length !== 0 && item.actionCode.indexOf('winning') === -1);
                            others.forEach(item => {
                                item.isPause = true;
                            });
                        }
                    }
                    this.lastShowCard = showCard;
                    userState.fatchCard = undefined;//清空玩家刚刚抓到的牌
                    this.sendData();
                }
            },
            {
                actionName: 'chooseColor',
                actionFn: function (_data) {
                    const data = JSON.parse(_data);
                    const userState = this.gameState.filter(item => item.uid === data.uid)[0];
                    userState.colorLack = data.color;
                    this.sendData();
                    setTimeout(() => {
                        if (this.gameState.filter(item => item.colorLack === '').length === 0) {
                            //如果所有人都选择了花色，那么开始发牌（庄家会接收）
                            this.fatchCard();
                            this.sendData();
                        }
                    }, 20);
                }
            },
            {
                actionName: 'action',
                actionFn: function (_data) {
                    const data = JSON.parse(_data);
                    const userState = this.gameState.find(item => item.uid === data.uid);
                    let isMineAction = userState.fatchCard ? true : false;//是否是自己
                    let isFatchCard = false;//动作执行之后是否有摸牌，主要是为了处理摸了牌之后玩家可能又有动作，那么就不清空actionCode(此场景目前一般是杠了再摸牌)
                    if (data.actionType === 'pass') {
                        //检查是否同时有其他杠、碰、胡
                        userState.actionCode = [];
                        if (this.gameState.filter(item => item.actionCode.length !== 0).length === 0) {
                            //没有其他玩家有动作了，正常走
                            if (!isMineAction) {
                                //如果不是自摸才下一个，不然还要出牌
                                const next = this.getNaxtCacher(this.lastShowCardUserState.uid);
                                this.setGamerCacher(next);
                                if (this.cards.length === 0) {
                                    //如果总牌数为0了，则结束游戏
                                    this.overHandler.call(this);
                                }else{
                                    this.fatchCard();//找打下一个人并摸牌
                                }
                            }
                        } else {
                            //先检查是否还有胡牌的玩家
                            //如果所有的胡牌玩家都过，那么才处理其他玩家的动作
                            let winners = this.gameState.filter(item => item.actionCode.indexOf('winning') !== -1);
                            if (winners.length === 0) {
                                //解开其他玩家的动作
                                let others = this.gameState.filter(item => item.actionCode.length !== 0 && item.actionCode.indexOf('winning') === -1);
                                others.forEach(item => {
                                    item.isPause = false;
                                });
                            } else {
                                //还有没做决定的胡牌玩家，那么继续走
                            }
                        }
                    } else {
                        //首先看是自己摸的牌还是别人打的，判断自己的fatchCard是否为空，如果是别人打的，要取得这张牌

                        const doCard = isMineAction ? clone(userState.fatchCard) : clone(this.lastShowCard);//需要处理的入参牌
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
                            // this.lastShowCardUserState.catcher = false;
                            // userState.catcher = true;//把自己设置为下一个出牌的人，这里不能摸牌
                            this.setGamerCacher(userState);
                        } else if (data.actionType === 'fullMeet') {
                            let meetToFull;
                            //检查是否是碰升级为杠
                            userState.groupCards.meet.forEach(_meet => {
                                if (_meet[0].color === doCard.color && _meet[0].number === doCard.number) {
                                    meetToFull = _meet;
                                }
                            })
                            if (meetToFull) {
                                meetToFull.push(doCard);
                            } else {
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
                            }
                            //this.lastShowCardUserState.catcher = false;
                            //userState.catcher = true;//把自己设置为下一个出牌的人
                            this.setGamerCacher(userState);
                            this.fatchCard(data.uid);//自己再摸一张牌
                            isFatchCard = true;
                        } else if (data.actionType === 'winning') {
                            //胡牌
                            //let next;
                            if (isMineAction) {
                                //自摸
                                this.castAccounts(userState, 'all', 100);
                                userState.fatchCard = undefined;
                                //next = this.getNaxtCacher(userState.uid);
                                userState.isWin = true;//注意这里要放在下一个后面，不然next为空（赢家里面已经没有此人了，无法获取我的下一个玩家是谁了）
                            } else {
                                //别人点炮
                                userState.isWin = true;//这里要放在前面，因为被筛选的数组中不带赢家
                                this.castAccounts(userState, this.lastShowCardUserState, 100);
                                //next = this.getNaxtCacher(this.lastShowCardUserState.uid);//
                            }
                            //找到下一个人并摸牌
                            const next = this.getNaxtCacher(userState.uid);
                            this.setGamerCacher(next);
                            this.fatchCard();
                            userState.groupCards.winCard = doCard;
                            if (this.gameState.filter(item => item.isWin === false).length === 1) {
                                this.overHandler.call(this);
                            }
                        }
                        //如果是自己摸的牌，因为已经clone了，这里要处理掉
                        //userState.fatchCard = undefined;//其实之后还是会统一处理掉，放这里为了好理解
                        //如果是别人打的牌，需要置空outCards里的那张牌
                        this.lastShowCardUserState.outCards = this.lastShowCardUserState.outCards.filter(card => card.key !== doCard.key);
                    }
                    if (!isFatchCard) userState.actionCode = [];
                    setTimeout(() => { this.sendData(); }, 10);
                }
            }
        ]
    }
    sendData(isOver) {
        this.sendMsgHandler({
            gameState: this.gameState,
            remainCardNumber: this.cards.length,
            lastShowCard: this.lastShowCard,
            isOver: this.isOver
        });
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
    //发牌，同时也就开始游戏了
    assignCard(callback) {
        this.gameState.forEach(userState => {
            userState.cards = this.cards.splice(0, 13).sort(objectArraySort('key'));
        });
        //获取指定的牌，主要还是快速调试
        // this.gameState[0].cards = [
        //     this.getSpecifiedCard('t', 1), this.getSpecifiedCard('t', 2), this.getSpecifiedCard('t', 3),
        //     this.getSpecifiedCard('t', 4), this.getSpecifiedCard('t', 5), this.getSpecifiedCard('t', 6),
        //     this.getSpecifiedCard('w', 1), this.getSpecifiedCard('w', 1), this.getSpecifiedCard('w', 1),
        //     this.getSpecifiedCard('w', 2), this.getSpecifiedCard('w', 3), this.getSpecifiedCard('w', 4), this.getSpecifiedCard('w', 5)
        // ].sort(objectArraySort('key'));
        // this.gameState[1].cards = [
        //     this.getSpecifiedCard('t', 4), this.getSpecifiedCard('t', 4), this.getSpecifiedCard('t', 5),
        //     this.getSpecifiedCard('t', 5), this.getSpecifiedCard('t', 6), this.getSpecifiedCard('t', 6),
        //     this.getSpecifiedCard('w', 5), this.getSpecifiedCard('w', 5), this.getSpecifiedCard('w', 6),
        //     this.getSpecifiedCard('w', 7), this.getSpecifiedCard('w', 7), this.getSpecifiedCard('w', 8), this.getSpecifiedCard('w', 1)
        // ].sort(objectArraySort('key'));
        // this.gameState[2].cards = [
        //     this.getSpecifiedCard('t', 1), this.getSpecifiedCard('t', 2), this.getSpecifiedCard('t', 3),
        //     this.getSpecifiedCard('t', 7), this.getSpecifiedCard('t', 8), this.getSpecifiedCard('t', 9),
        //     this.getSpecifiedCard('w', 2), this.getSpecifiedCard('w', 2), this.getSpecifiedCard('w', 3),
        //     this.getSpecifiedCard('w', 5), this.getSpecifiedCard('w', 7), this.getSpecifiedCard('w', 8),
        //     this.getSpecifiedCard('w', 9)
        // ].sort(objectArraySort('key'));

        if (this.colorType === 2) {
            //如果是两黄牌的话就直接发牌
            this.fatchCard();
        }
        this.sendData();
    }
    //抓牌
    fatchCard(uid) {
        const _uid = !uid ? this.gameState.find(item => item.catcher === true).uid : uid;
        const userState = this.gameState.find(item => item.uid === _uid);
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
        this.isOver = true;
        this.overHandler = fn;
    }
    setSendMsg(fn) {
        this.sendMsgHandler = fn;
    }
}
module.exports = Majiang;