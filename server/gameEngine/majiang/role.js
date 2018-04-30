const objectArraySort = function (keyName) {
    return function (objectN, objectM) {
        var valueN = objectN[keyName]
        var valueM = objectM[keyName]
        if (valueN < valueM) return -1
        else if (valueN > valueM) return 1
        else return 0
    }
}
const concatCard = (cards, groupCards) => {
    //返回所有牌的组合(排序后的)
    let allCards = [];
    allCards = allCards.concat(cards);
    groupCards.meet.forEach(meetArr => {
        allCards = allCards.concat(meetArr);
    })
    groupCards.fullMeet.forEach(meetArr => {
        allCards = allCards.concat(meetArr);
    })
    return allCards.sort(objectArraySort('key'));
}
const getCardShowTime = (cards) => {
    let resultType_1 = {}, resultType_2 = {
        one: [], two: [], three: [], four: []
    };
    cards.forEach(card => {
        if (resultType_1[card.color + card.number]) {
            resultType_1[card.color + card.number].count += 1;
        } else {
            let obj = {
                count: 1,
                card: card
            };
            resultType_1[card.color + card.number] = obj;
        }
    });
    for (let item in resultType_1) {
        if (resultType_1[item].count === 1) {
            resultType_2.one.push(item);
        } else if (resultType_1[item].count === 2) {
            resultType_2.two.push(item);
        } else if (resultType_1[item].count === 3) {
            resultType_2.three.push(item);
        } else if (resultType_1[item].count === 4) {
            resultType_2.four.push(item);
        }
    }
    // {
    //     't4':2,
    //     'w3':1,
    //     'b8':3
    // }
    // {
    //     one:[],
    //     two:[],
    //     three:[],
    //     four:[]
    // }
    return { resultType_1, resultType_2 };
}
const allRoles = [
    {
        code: 'normal',
        name: '平胡',
        multiple: 1,
        role: ({ cards, cardsTime2 }) => {
            //必须存在连子和三对，加一对(只要是存在单牌应该就是了) 
            if (cardsTime2.one.length >= 1) {
                return true;
            } else {
                return false;
            }
        }
    }, {
        code: 'allColoe',
        name: '清一色',
        multiple: 4,
        role: ({ allCards }) => {
            //全部颜色一致
            let last = allCards[0].color;
            for (let i = 1; i < allCards.length; i++) {
                if (allCards[i].color !== last) {
                    return false;
                }
            }
            return true;
        }
    }, {
        code: 'bigPair',
        name: '大对子',
        multiple: 2,
        role: ({ cards, cardsTime2 }) => {
            //n个三对加一对 AAA BBB CCC DDD EE
            if (cardsTime2.one.length === 0 && cardsTime2.two.length === 1 && cardsTime2.three.length >= 1) {
                return true;
            }
            return false;
        }
    }, {
        code: 'oneNine',
        name: '幺九',
        multiple: 4,
        role: ({ cards, cardsTime2 }) => {
            //每一坎牌都有1或者9存在
            //1和9加起来应该有6张牌就对了
            return false;
        }
    }, {
        code: 'sevenPair',
        name: '七对',
        multiple: 4,
        role: ({ cards, cardsTime2 }) => {
            //七个对牌，不能有杠
            if (cardsTime2.two.length === 7) {
                return true;
            }
            return false;
        }
    }, {
        code: 'superSevenPair',
        name: '龙七对',
        multiple: 4,
        role: ({ cards, cardsTime2 }) => {
            //七个对牌，有杠牌（因为要计算杠牌，有几杠算几番，基数还是4）
            //没有三对牌和单牌，且存在4对
            if (cardsTime2.three.length === 0 && cardsTime2.four.length >= 1 && cardsTime2.one.length === 0 && cards.length === 14) {
                return true;
            }
            return false;
        }
    }
]
const actions = [
    {
        code: 'triggerWin',
        name: '点炮',
        multiple: 1
    }, {
        code: 'selfWin',
        name: '自摸',
        multiple: 1
    }, {
        code: 'beginWin',
        name: '天胡',
        multiple: 2
    }, {
        code: 'endWin',
        name: '海底',
        multiple: 2
    }, {
        name: 'fullMeetWin',
        code: '杠上花',
        multiple: 2
    }, {
        name: 'fullMeetLose',
        code: '杠上炮',
        multiple: 2
    }, {
        code: 'robFullMeetWin',//被抢杠的人输分翻番
        name: '抢杠',
        multiple: 2
    },
]
let roleGuoup = {}; 

roleGuoup.role_chengdu = (() => {
    const _role = ['normal', 'allColoe', 'bigPair', 'oneNine', 'sevenPair', 'superSevenPair'];
    return allRoles.filter(item => {
        if (_role.indexOf(item.code) !== -1) {
            return true;
        }
        return false;
    });
})();



const trggleAction = (type, name, card) => {
    let handCards = card.cards.concat([card.cardByCatch]);
    let allCards = concatCard(card.cards, card.groupCards);
    allCards = allCards.concat([card.cardByCatch]);
    //获取手牌中的杠和已呼出来的杠
    //let inFullMeet = 0, outFullmeet = card.groupCards.fullMeet.length;
    let { resultType_1, resultType_2 } = getCardShowTime(allCards);
    let fullMeetCount = resultType_2.four.length;
    // let cardsTime = getCardShowTime(card.cards).resultType_1;
    // for (let item in cardsTime) {
    //     if (cardsTime[item] === 4) { fullMeetCount++; }
    // }
    let roles = [], action = actions.find(item => item.code === name);
    roleGuoup[type].forEach(item => {
        if (item.role({ cards: handCards, allCards: allCards, cardsTime1: resultType_1, cardsTime2: resultType_2 })) {
            roles.push({
                code: item.code,
                name: item.name,
                multiple: item.multiple
            });
        }
    });
    return { action, roles, fullMeetCount };//返回胡牌类型、动作类型、杠数
}


module.exports = trggleAction;