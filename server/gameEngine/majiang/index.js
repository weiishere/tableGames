const getRedom = require('../../util/redom');
const UUID = require('../../util/uuid');
const winCore = require('./winCore');
const clone = require('clone');
const getRule = require('./rule');
let rule = undefined;
const writeLog = require('../../util/errorLog');

let winActionListening = {};
let sssIndex = 10;
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
        rule = getRule(option.rule);
        const _option = Object.assign({
            gameId: (new UUID()).generateUUID(),
            gameState: [{ uid: '1' }, { uid: '2' }, { uid: '3' }, { uid: '4' }],
            // gameState: [
            //     { uid: '1', increase: 0, cards: [], groupCards: [] },
            //     { uid: '2', increase: 0, cards: [], groupCards: [] },
            //     { uid: '3', increase: 0, cards: [], groupCards: [] },
            //     { uid: '4', increase: 0, cards: [], groupCards: [] }
            // ],
        }, rule.option, option || {});
        Object.keys(_option).forEach((item) => {
            this[item] = _option[item];
        });
        //this.colorType = 3;
        this.cards = [];
        this.lastShowCardUserState = null;
        this.lastShowCard = undefined;
        this.isOver = false;
        this.master = option.master;
    }
    init(gameState) {
        //需要为state做一个排序，用于之后顺序摸牌(不排了)
        this.gameState = gameState.map(state => {
            return {
                uid: state.uid,
                name: state.name,
                isWin: false,
                winDesc: '',
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
        //加入中发白
        if (this.zfb) {
            ['hz', 'fc', 'bb'].forEach(cardColor => {
                for (let i = 1; i <= 4; i++) {
                    _cards.push({ key: `card-${cardColor}-${i}`, color: cardColor, number: 1 });
                }
            })
        }
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
    checkCanWin() {
        const remainGamerState = this.gameState.filter(state => !state.isWin);
        remainGamerState.forEach(state => {
            if (!this.validateCanWin(state.uid)) {
                //如果没叫，赔偿其他
                state.winDesc = '查叫赔偿×1倍';
                this.castAccounts(state, 'all', -1);
            }
        });
        this.sendData();
    }
    //察叫
    validateCanWin(uid) {
        const userState = this.gameState.find(item => item.uid === uid);
        //要验证的牌（除去缺的牌）
        let validateCards = [];
        ['w', 't', 'b'].filter(item => item !== userState.colorLack).forEach(color => {
            for (let i = 1; i <= 9; i++) { validateCards.push({ key: color + i, number: i, color: color }); }
        });
        if (this.zfb) {
            ['hz', 'fc', 'bb'].forEach((color, i) => {
                validateCards.push({ key: color + i, number: 1, color: color });
            });
        }
        for (let i = 0; i < validateCards.length; i++) {
            const _cards = userState.cards.concat(validateCards[i]).sort(objectArraySort('key'));
            if (winCore(_cards)) return true;
        }
        return false;
    }
    //【核心算法函数】处理牌桌子上的各种情况，返回是否暂停，并发送消息
    doGameState(uid, showCrad, from) {
        try {
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
        } catch (e) {
            writeLog('doGameState', e);
        }
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

        // ws.emit('showCard', JSON.stringify({
        //     roomId: this.props.room.roomId,
        //     uid: this.props.user.uid,
        //     cardKey: this.state.activeCard.key
        // }));

        const showCard = function (data) {
            try {
                const userState = this.gameState.find(item => item.uid === data.uid);
                if (userState.testWinType) userState.testWinType = '';//出牌的时候解除胡牌类型监控，？？
                let showCard;
                if (userState.fatchCard && userState.fatchCard.key === data.cardKey) {
                    //直接打出了刚刚摸的牌
                    showCard = userState.fatchCard;
                    // console.log('-------------------------------------if----------------------------');
                    // console.log(showCard);
                    userState.outCards.push(clone(userState.fatchCard));
                    //userState.fatchCard = undefined;
                } else {
                    showCard = userState.cards.find(item => item.key === data.cardKey);
                    // console.log('-------------------------------------else----------------------------');
                    // console.log(showCard);
                    userState.outCards.push(showCard);
                    userState.cards = userState.cards.filter(item => item.key !== data.cardKey);
                    //fatchCard可能为空（碰了之后不会摸牌）
                    userState.fatchCard && userState.cards.push(clone(userState.fatchCard));
                    userState.cards = userState.cards.sort(objectArraySort('key'));
                    //userState.fatchCard = undefined;
                }
                this.lastShowCardUserState = userState;
                //判断是否需要暂停
                if (!this.doGameState(data.uid, showCard, 'other')) {
                    //无须暂定，下一个玩家抓牌
                    //this.setGamerCacher(nextCatcher);

                    const next = this.getNaxtCacher(userState.uid);
                    this.setGamerCacher(next);
                    if (!this.fatchCard({})) return false;
                    // if (this.cards.length === 0) {
                    //     //如果总牌数为0了，则结束游戏
                    //     //this.isOver = true;
                    //     this.checkCanWin();//请觉并结算
                    //     this.overHandler.call(this);
                    // } else {
                    //     this.fatchCard({});//发牌
                    // }
                } else {
                    this.setGamerCacher();//都设置为false
                    //暂停，等待玩家做出动作，有动作的话
                    // let winners = this.gameState.filter(item => item.actionCode.indexOf('winning') !== -1);
                    // if (winners.length !== 0) {
                    //     //说明有玩家有胡牌，那么需要暂时禁用掉其他有动作玩家的非胡牌操作
                    //     let others = this.gameState.filter(item => item.actionCode.length !== 0 && item.actionCode.indexOf('winning') === -1);
                    //     others.forEach(item => {
                    //         item.isPause = true;
                    //     });
                    // }
                }
                this.lastShowCard = showCard;
                userState.fatchCard = undefined;//清空玩家刚刚抓到的牌
                this.sendData();
            } catch (e) {
                writeLog('showCard', e);
            }
        }
        return [
            {
                actionName: 'showCard',
                actionFn: function (_data) {
                    const data = JSON.parse(_data);
                    showCard.call(this, data);
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
                            //如果所有人都选择了花色，那么开始发牌并设定抓牌人（庄家）
                            this.setFrist();
                            if (!this.fatchCard({ listenType: ['beginWin'] })) return false;//抓牌并监控天胡
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
                        try {
                            //检查是否同时有其他杠、碰、胡
                            userState.actionCode = [];
                            if (!this.gameState.find(item => item.actionCode.length !== 0)) {
                                //没有其他玩家有动作了，正常走
                                //先检查有没有被抢杠或者抢胡等待的朋友，要恢复人家的杠/碰
                                const hadRobFullMeetState = this.gameState.find(state => state.testWinType === 'robFullMeetWin');
                                const hadRobMeetState = this.gameState.find(state => state.testWinType === 'robMeetWin');
                                if (hadRobFullMeetState) {
                                    //state.actionCode = ['fullMeet'];
                                    let meetToFull;
                                    //检查是否是碰升级为杠
                                    hadRobFullMeetState.groupCards.meet.forEach(_meet => {
                                        if (_meet[0].color === this.lastShowCard.color && _meet[0].number === this.lastShowCard.number) {
                                            meetToFull = _meet;
                                            hadRobFullMeetState.groupCards.fullMeet.push(clone(meetToFull));
                                            hadRobFullMeetState.groupCards.meet = hadRobFullMeetState.groupCards.meet.filter(_meet => _meet[0].color !== doCard.color && _meet[0].number !== doCard.number);
                                        }
                                    })
                                    meetToFull.push(clone(this.lastShowCard));
                                    this.setGamerCacher(hadRobFullMeetState);//把自己设置为下一个出牌的人
                                    if (!this.fatchCard({ uid: hadRobFullMeetState.uid, listenType: ['fullMeetWin', 'fullMeetLose'] })) return false;//自己再摸一张牌，并附上杠上花、杠上炮监听
                                    hadRobFullMeetState.outCards = hadRobFullMeetState.outCards.filter(card => card.key !== this.lastShowCard.key);
                                    hadRobFullMeetState.winDesc = '';
                                    setTimeout(() => { this.sendData(); }, 10);
                                    return;
                                } else if (hadRobMeetState) {
                                    let count = 0;//只能取两张（可能玩家手上有3张符合的牌）
                                    let _meet = [this.lastShowCard];
                                    hadRobMeetState.cards = hadRobMeetState.cards.filter(card => {
                                        if (card.color === this.lastShowCard.color && card.number === this.lastShowCard.number && count < 2) {
                                            count++;
                                            _meet.push(card);
                                            return false;
                                        } else {
                                            return true;
                                        }
                                    });
                                    hadRobMeetState.groupCards.meet.push(_meet);
                                    this.setGamerCacher(hadRobMeetState);
                                    hadRobMeetState.winDesc = '';
                                    setTimeout(() => { this.sendData(); }, 10);
                                    return;
                                } else {
                                    if (!isMineAction) {
                                        //如果不是自摸才下一个，不然还要出牌
                                        const next = this.getNaxtCacher(this.lastShowCardUserState.uid);
                                        this.setGamerCacher(next);
                                        if (!this.fatchCard({})) return false;
                                        // if (this.cards.length === 0) {
                                        //     //如果总牌数为0了，则结束游戏
                                        //     //this.isOver = true;
                                        //     this.checkCanWin();//请觉并结算
                                        //     this.overHandler.call(this);
                                        // } else {
                                        //     this.fatchCard({});//找打下一个人并摸牌
                                        // }
                                    }
                                }
                            } else {
                                //先检查是否还有胡牌的玩家
                                //如果所有的胡牌玩家都过，那么才处理其他玩家的动作
                                // let winners = this.gameState.filter(item => item.actionCode.indexOf('winning') !== -1);
                                // if (winners.length === 0) {
                                //     //解开其他玩家的动作
                                //     let others = this.gameState.filter(item => item.actionCode.length !== 0 && item.actionCode.indexOf('winning') === -1);
                                //     others.forEach(item => {
                                //         item.isPause = false;
                                //     });
                                // } else {
                                //     //还有没做决定的胡牌玩家，那么继续走
                                // }
                            }
                        } catch (e) {
                            writeLog('pass', e);
                        }
                    } else {
                        //首先看是自己摸的牌还是别人打的，判断自己的fatchCard是否为空，如果是别人打的，要取得这张牌

                        const doCard = isMineAction ? clone(userState.fatchCard) : clone(this.lastShowCard);//需要处理的入参牌
                        if (data.actionType === 'meet' && !isMineAction) {
                            let robMeetWin = false;
                            //这里要判断是否有其他人要胡，如果有，先等待
                            let winners = this.gameState.filter(item => item.actionCode.indexOf('winning') !== -1);
                            if (winners.length !== 0) robMeetWin = true;

                            if (robMeetWin) {
                                userState.testWinType = 'robMeetWin';//被抢胡等待
                                userState.winDesc = '等待其他玩家选择是否胡牌~';
                                userState.actionCode = [];
                            } else {
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
                            }
                        } else if (data.actionType === 'fullMeet') {
                            try {
                                let meetToFull;
                                //检查是否是碰升级为杠
                                userState.groupCards.meet.forEach(_meet => {
                                    if (_meet[0].color === doCard.color && _meet[0].number === doCard.number) {
                                        meetToFull = _meet;
                                    }
                                })
                                let robFullMeetWin = false;
                                if (meetToFull) {
                                    //这里要判断是否有其他人要胡，如果有，这种动作就是抢杠
                                    this.gameState.filter(state => !state.isWin && state.uid !== data.uid).forEach(state => {
                                        const _cards = state.cards.concat(doCard).sort(objectArraySort('key'));
                                        if (winCore(_cards)) {
                                            state.actionCode.push('winning');//有胡牌
                                            robFullMeetWin = true;
                                        }
                                    })
                                    //如果有人要抢杠，那么就强制把这张牌出了，如果别人不抢，那么就再执行杠
                                    if (robFullMeetWin) {
                                        userState.testWinType = 'robFullMeetWin';//被抢杠等待
                                        userState.winDesc = '等待其他玩家选择抢杠~';
                                        userState.actionCode = [];
                                        showCard.call(this, {
                                            roomId: data.roomId,
                                            uid: data.uid,
                                            cardKey: doCard.key
                                        });
                                        return false;
                                    } else {
                                        meetToFull.push(doCard);
                                        userState.groupCards.fullMeet.push(clone(meetToFull));
                                        userState.groupCards.meet = userState.groupCards.meet.filter(_meet => _meet[0].color !== doCard.color && _meet[0].number !== doCard.number);
                                    }
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
                                //userState.catcher = true;
                                this.setGamerCacher(userState);//把自己设置为下一个出牌的人
                                // let listenType = ['fullMeetWin', 'fullMeetLose'];
                                // if (robFullMeetWin) listenType.push('robFullMeetWin');
                                //自己再摸一张牌，并附上杠上花、杠上炮监听
                                if (!this.fatchCard({ uid: data.uid, listenType: ['fullMeetWin', 'fullMeetLose'] })) return false;
                                isFatchCard = true;
                            } catch (e) {
                                writeLog('fullMeet', e);
                            }
                        } else if (data.actionType === 'winning') {
                            try {
                                //胡牌
                                //let next;
                                //如果是第一个人胡牌的，就是master
                                if (this.gameState.filter(state => state.isWin).length === 0) {
                                    userState.master = true;
                                } else {
                                    userState.master = false;
                                }
                                userState.groupCards.winCard = doCard;
                                if (isMineAction) {
                                    //testWinType可能是天胡、地胡、杠上花之类的行为
                                    // let { action, roles, fullMeetCount } = trggleAction('role_chengdu', userState.testWinType ? userState.testWinType : 'selfWin', { cards: userState.cards, groupCards: userState.groupCards, cardByCatch: doCard });
                                    // let roles_multiple = 1;
                                    // roles.forEach(role => {
                                    //     roles_multiple = roles_multiple * role.multiple;
                                    // });
                                    let { action, result, allMultipl } = rule.trggleAction(userState.cards, userState.groupCards, userState.testWinType ? userState.testWinType : 'selfWin')
                                    this.castAccounts(userState, 'all', allMultipl);
                                    userState.fatchCard = undefined;
                                    //next = this.getNaxtCacher(userState.uid);
                                    userState.isWin = true;//注意这里要放在下一个后面，不然next为空（赢家里面已经没有此人了，无法获取我的下一个玩家是谁了）
                                    userState.winDesc = `${action.name}(${action.multiple})+${result.map(item => item.name + `(${item.multiple})`).join('+')}`;
                                } else {
                                    //别人点炮
                                    //testWinType可能是杠上炮、抢杠
                                    // let { action, roles, fullMeetCount } = trggleAction('role_chengdu', this.lastShowCardUserState.testWinType ? this.lastShowCardUserState.testWinType : 'triggerWin', { cards: userState.cards, groupCards: userState.groupCards, cardByCatch: doCard });//点炮
                                    // let roles_multiple = 1;
                                    // roles.forEach(role => {
                                    //     roles_multiple = roles_multiple * role.multiple;
                                    // });
                                    let { action, result, allMultipl } = rule.trggleAction(userState.cards, userState.groupCards, userState.testWinType ? userState.testWinType : 'triggerWin')
                                    userState.isWin = true;//这里要放在前面，因为被筛选的数组中不带赢家
                                    userState.winDesc = `${this.lastShowCardUserState.name}${action.name}(${action.multiple})+${result.map(item => item.name + `(${item.multiple})`).join('+')}`;
                                    //userState.winDesc = `${this.lastShowCardUserState.name}${action.name}(${action.multiple}倍) + ${roles.map(role => role.name)}(${roles_multiple}倍) × ${fullMeetCount}杠`;
                                    //this.castAccounts(userState, this.lastShowCardUserState, action.multiple * roles_multiple * (fullMeetCount !== 0 ? fullMeetCount * 2 : 1));
                                    this.castAccounts(userState, this.lastShowCardUserState, allMultipl);
                                    //next = this.getNaxtCacher(this.lastShowCardUserState.uid);//
                                }
                                //winActionListening = winActionListening.filter(item.uid !== userState.uid);//去掉此玩家的监听
                                if (this.gameState.filter(item => item.isWin === false).length === 1) {
                                    //this.isOver = true;
                                    this.overHandler.call(this);
                                } else {
                                    //这里还要看有没有其他玩家要继续胡牌，没有才执行下一家人摸牌
                                    let winners = this.gameState.filter(item => item.actionCode.indexOf('winning') !== -1 && item.uid !== data.uid);
                                    if (winners.length >= 1) {
                                        //继续等待
                                    } else {
                                        const next = this.getNaxtCacher(userState.uid);
                                        //找到下一个人并摸牌
                                        this.setGamerCacher(next);
                                        if (!this.fatchCard({})) return false;
                                    }
                                }
                            } catch (e) {
                                writeLog('winningAction', e);
                            }
                        }
                        //如果是自己摸的牌，因为已经clone了，这里要处理掉
                        //userState.fatchCard = undefined;//其实之后还是会统一处理掉，放这里为了好理解
                        //如果是别人打的牌，需要置空outCards里的那张牌
                        this.lastShowCardUserState && (this.lastShowCardUserState.outCards = this.lastShowCardUserState.outCards.filter(card => card.key !== doCard.key));

                    }

                    userState.actionCode = [];
                    // if (!isFatchCard) {
                    //     userState.actionCode = [];
                    // } else {
                    //     if (userState.actionCode.indexOf('winning') !== -1) {
                    //         //杠上花监听
                    //         //winActionListening.push({ uid: userState.uid, type: 'fullMeetWin' });
                    //     }
                    // }
                    setTimeout(() => { this.sendData(); }, 10);
                }
            }
        ]
    }
    //设定庄家，根据上一局的第一赢家
    setFrist() {
        //优先选择master=true上一次的第一胡牌赢家，如果没有master，再找庄家，如果庄家也找不到了，就设置第一个为catcher
        const lastMaster = this.gameState.find(state => state.master);
        if (lastMaster) {
            this.gameState.forEach((state, index) => state.catcher = (state.uid === lastMaster.uid ? true : false));
        } else {
            const fristMaster = this.gameState.find(state => state.uid === this.master.uid);
            if (fristMaster) {
                this.gameState.forEach((state, index) => state.catcher = (state.uid === this.master.uid ? true : false));
            } else {
                this.gameState.forEach((state, index) => state.catcher = (index === 0 ? true : false));
            }
        }

    }
    sendData(uid) {
        this.sendMsgHandler({
            gameState: this.gameState,
            remainCardNumber: this.cards.length,
            lastShowCard: this.lastShowCard,
            isOver: this.isOver
        }, uid);
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
        //     this.getSpecifiedCard('t', 6), this.getSpecifiedCard('t', 8), this.getSpecifiedCard('t', 9),
        //     this.getSpecifiedCard('w', 2), this.getSpecifiedCard('w', 2), this.getSpecifiedCard('w', 2),
        //     this.getSpecifiedCard('w', 6), this.getSpecifiedCard('w', 7), this.getSpecifiedCard('w', 8),
        //     this.getSpecifiedCard('w', 9)
        // ].sort(objectArraySort('key'));

        if (this.colorType === 2) {
            //如果是两黄牌的话就直接设定下一个抓牌人并发牌
            this.setFrist();
            this.fatchCard({ listenType: ['beginWin'] });//抓牌并监控天胡
        }
        this.sendData();
    }

    //抓牌
    fatchCard({ uid, listenType }) {
        try {
            if (this.cards.length === 0) {
                //如果总牌数为0了，则结束游戏
                this.isOver = true;
                this.checkCanWin();//请觉并结算
                this.overHandler.call(this);
                return false;
            }
            const _uid = !uid ? this.gameState.find(item => item.catcher === true).uid : uid;
            const userState = this.gameState.find(item => item.uid === _uid);

            const cardByCatch = this.cards.splice(0, 1)[0];
            if (this.cards.length === 0) {
                //最后一张牌了，海底
                if (!listenType) listenType = [];
                listenType.push('endWin');
            }
            //sssIndex++;
            //const cardByCatch = sssIndex <= 14 ? { key: 'card-w-4-' + sssIndex, number: 4, color: 'w' } : { key: 'card-t-6-' + sssIndex, number: 6, color: 't' };
            // sssIndex++;
            // const cardByCatch = sssIndex <= 6 ? { key: 'card-t-8-' + sssIndex, number: 8, color: 't' } : { key: 'card-t-6-' + sssIndex, number: 6, color: 't' };
            userState.fatchCard = cardByCatch;
            if (userState.testWinType) userState.testWinType = '';
            if (userState.winDesc) userState.winDesc = '';
            //判断用户拿到牌之后是否需要用户做出其他选择(胡牌、杠)
            if (!this.doGameState(_uid, cardByCatch, 'self')) {
                //没有自己没有需要处理的动作，而且是杠的话，那么下一步就是打一张牌出去，其他用户头上就要加上杠上炮监听
                if (listenType && listenType.indexOf('fullMeetLose') !== -1) {
                    this.gameState.forEach(item => {
                        if (!item.isWin && item.uid !== userState.uid && item.testWinType && item.testWinType.indexOf('fullMeetLose') === -1) {
                            item.testWinType = 'fullMeetLose';
                        }
                    });
                }
                //listenType && (userState['testWinType'] = listenType);
            } else {
                //如果自己胡牌，判断是不是杠上花，是则加上杠上花监听
                if (listenType && listenType.indexOf('fullMeetWin') !== -1) {
                    userState['testWinType'] = 'fullMeetWin';
                }
                if (listenType && listenType.indexOf('beginWin') !== -1) {
                    userState['testWinType'] = 'beginWin';
                }
                if (listenType && listenType.indexOf('endWin') !== -1) {
                    userState['testWinType'] = 'endWin';
                }
            }
            return cardByCatch;
        } catch (e) {
            writeLog('fatchCard', e);
        }
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