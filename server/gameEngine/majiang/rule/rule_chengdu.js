const clone = require('clone');
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
const rules = [
    //平胡
    ({ cards, cardsTime2 }) => {
        //必须存在连子和三对，加一对(只要是存在单牌应该就是了) 
        if (cardsTime2.one.length >= 1) {
            return { name: '平胡', multiple: 1 };
        } else {
            return { multiple: 0 };
        }
    },
    //清一色
    ({ cards }) => {
        //全部颜色一致
        let last = cards.allCards[0].color;
        for (let i = 1; i < cards.allCards.length; i++) {
            if (cards.allCards[i].color !== last) {
                return { multiple: 0 };
            }
        }
        return { name: '清一色', multiple: 4 };
    },
    //大对子 
    ({ cardsTime2 }) => {
        //n个三对加一对 AAA BBB CCC DDD EE
        if (cardsTime2.one.length === 0 && cardsTime2.two.length === 1 && cardsTime2.three.length >= 1) {
            return { name: '大对子', multiple: 2 };
        }
        return { multiple: 0 };
    },
    //暗（龙）七对
    ({ }) => {
        //每一坎牌都有1或者9存在
        //1和9加起来应该有6张牌就对了，暂时不考虑
        return { multiple: 0 };
    }, ({ cards, cardsTime2 }) => {
        //七个对牌，不能有杠
        if (cardsTime2.one.length === 0 && cardsTime2.three.length === 0 && cards.handCards.length === 14) {
            if (cardsTime2.four.length >= 1) {
                return { name: '龙七对', multiple: 4 };//因为杠会单独算番，这里只是给个名字
            } else {
                return { name: '暗七对', multiple: 4 };
            }
        }
        return { multiple: 0 };
    },
    //杠(包括暗杠)
    ({ cards, cardsTime2 }) => {
        let name = '', multiple = 0;
        let outFullMeet = cards.groupCards.fullMeet.length;
        multiple += outFullMeet;
        let { resultType_1, resultType_2 } = getCardShowTime(cards.handCards);
        let inFullMeet = resultType_2.four.length;
        multiple += inFullMeet;
        if (multiple !== 0) {
            name = '杠×' + multiple;
        }
        return { name: name, multiple: (multiple * 2) }
    },
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
        code: 'fullMeetWin',
        name: '杠上花',
        multiple: 2
    }, {
        code: 'fullMeetLose',
        name: '杠上炮',
        multiple: 2
    }, {
        code: 'robFullMeetWin',//被抢杠的人输分翻番
        name: '抢杠',
        multiple: 2
    },
]



// let roleGuoup = {};
// roleGuoup.role_chengdu = (() => {
//     const _role = ['normal', 'allColoe', 'bigPair', 'oneNine', 'sevenPair', 'superSevenPair'];
//     return allRoles.filter(item => {
//         if (_role.indexOf(item.code) !== -1) {
//             return true;
//         }
//         return false;
//     });
// })();

// const trggleAction = (type, name, card) => {
//     let handCards = card.cards.concat([card.cardByCatch]);
//     let allCards = concatCard(card.cards, card.groupCards);
//     allCards = allCards.concat([card.cardByCatch]);
//     //获取手牌中的杠和已呼出来的杠
//     //let inFullMeet = 0, outFullmeet = card.groupCards.fullMeet.length;
//     let { resultType_1, resultType_2 } = getCardShowTime(allCards);
//     let fullMeetCount = resultType_2.four.length;
//     // let cardsTime = getCardShowTime(card.cards).resultType_1;
//     // for (let item in cardsTime) {
//     //     if (cardsTime[item] === 4) { fullMeetCount++; }
//     // }
//     let roles = [], action = actions.find(item => item.code === name);
//     roleGuoup[type].forEach(item => {
//         if (item.role({ cards: handCards, allCards: allCards, cardsTime1: resultType_1, cardsTime2: resultType_2 })) {
//             roles.push({
//                 code: item.code,
//                 name: item.name,
//                 multiple: item.multiple
//             });
//         }
//     });
//     return { action, roles, fullMeetCount };//返回胡牌类型、动作类型、杠数
// }
//const trggleAction = (type, name, card) => {
const trggleAction = (handCards, group, actionName) => {
    let result = [], allMultipl = 1;
    let _handCards = handCards.concat(group.winCard);
    let allCards = concatCard(_handCards, group);
    //获取手牌中的杠和已呼出来的杠
    //let { resultType_1, resultType_2 } = getCardShowTime(handCards);
    // return { action, roles, fullMeetCount };//返回胡牌类型、动作类型、杠数
    let { resultType_1, resultType_2 } = getCardShowTime(allCards);
    let action = actions.find(item => item.code === actionName);
    allMultipl = allMultipl * action.multiple;
    rules.forEach(item => {
        const ruleResult = item({ cards: { allCards: allCards, handCards: _handCards, groupCards: group }, cardsTime1: resultType_1, cardsTime2: resultType_2 });
        if (ruleResult.multiple) {
            allMultipl = allMultipl * ruleResult.multiple;
            result.push(ruleResult);
        }
    });
    return { action, result, allMultipl };
}

module.exports = trggleAction;