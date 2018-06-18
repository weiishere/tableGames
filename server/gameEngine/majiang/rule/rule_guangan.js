const clone = require('clone');
const winCore = require('../winCore');
const tool = require('./tool');
//{color:'fc',number:0,key:'fc-1'}//发财
//{color:'hz',number:0,key:'hz-1'}//红中
//{color:'bb',number:0,key:'bb-1'}//白板
// const thisCards = [
//     { color: 't', number: 1, key: 't-1-1' }, { color: 't', number: 1, key: 't-1-2' }, { color: 't', number: 1, key: 't-1-3' },
//     { color: 't', number: 2, key: 't-2-1' }, { color: 't', number: 2, key: 't-2-2' }, { color: 't', number: 2, key: 't-2-3' },
//     { color: 't', number: 4, key: 't-4-1' }, { color: 't', number: 4, key: 't-4-2' }, { color: 't', number: 4, key: 't-4-3' },
//     { color: 't', number: 5, key: 't-5-1' }, { color: 't', number: 5, key: 't-5-2' }, { color: 't', number: 5, key: 't-5-3' },
//     { color: 'w', number: 9, key: 'w-9-1' }
// ];

// const thisCards = [
//     { color: 't', number: 1, key: 't-1-1' }, { color: 't', number: 1, key: 't-1-2' }, { color: 't', number: 2, key: 't-2-1' },
//     { color: 't', number: 2, key: 't-2-2' }, { color: 't', number: 3, key: 't-3-1' }, { color: 'w', number: 6, key: 'w-6-3' },
//     { color: 'w', number: 6, key: 't-6-1' }, { color: 'w', number: 6, key: 't-6-2' }, { color: 'w', number: 7, key: 't-7-1' },
//     { color: 'w', number: 7, key: 'w-7-2' }, { color: 'w', number: 8, key: 'w-8-1' }, { color: 'w', number: 8, key: 'w-8-2' },
//     { color: 'w', number: 9, key: 'w-9-1' }
// ];

const thisCards = [
    { color: 't', number: 1, key: 't-1-1' }, { color: 't', number: 1, key: 't-1-2' },
    { color: 't', number: 2, key: 't-2-1' }, { color: 't', number: 2, key: 't-2-2' },
    { color: 't', number: 3, key: 't-3-1' }, { color: 't', number: 3, key: 't-3-2' },
    { color: 't', number: 5, key: 't-5-1' }, { color: 't', number: 5, key: 't-5-2' },
    { color: 't', number: 5, key: 't-5-3' }, { color: 't', number: 5, key: 't-5-4' },
    { color: 'hz', number: 0, key: 'w-7-1' }, { color: 'hz', number: 0, key: 'w-7-2' },
    { color: 'hz', number: 0, key: 'hz-1' }
];

//一条龙测试
// const thisCards = [
//     { color: 't', number: 1, key: 't-1-1' }, { color: 't', number: 2, key: 't-2-1' }, { color: 't', number: 2, key: 't-2-1' },
//     { color: 't', number: 3, key: 't-3-1' }, { color: 't', number: 3, key: 't-3-2' }, { color: 't', number: 4, key: 't-4-1' },
//     { color: 't', number: 5, key: 't-5-2' }, { color: 't', number: 6, key: 't-6-1' }, { color: 't', number: 7, key: 't-7-1' },
//     { color: 't', number: 8, key: 't-8-2' }, { color: 't', number: 8, key: 't-8-1' }, { color: 't', number: 9, key: 't-9-1' },
//     { color: 't', number: 9, key: 't-9-1' }
// ];

const thisCompCard = { color: 'hz', number: 0, key: 'hz-2' };
/*const objectArraySort = function (keyName) {
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
const tool.getCardShowTime = (cards) => {
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
}*/

//板子判断
const isBanzi = (cards) => {
    let { resultType_1, resultType_2 } = tool.getCardShowTime(cards);
    let twos = resultType_2.two;
    resultType_2.four.forEach(item => {
        twos.push(item);
        twos.push(item);//分解成2个
    });
    twos = twos.map(item => { return resultType_1[item].card }).sort((a, b) => { return a.number - b.number; });
    let dbzCount = 0, xbzCount = 0;
    for (let i = 0; i < twos.length; i++) {
        let frist = twos[i];
        if (!frist) continue;
        let second = twos.find(item => item.color === frist.color && item.number - frist.number === 1);
        let third = twos.find(item => item.color === frist.color && item.number - frist.number === 2);
        let fourth = twos.find(item => item.color === frist.color && item.number - frist.number === 3);
        if (second && third && fourth) {
            dbzCount = 1;
            break;
        } else if (second && third) {
            xbzCount++;
            frist = second = third = null;
            continue;
        }
    }
    return { dbzCount, xbzCount }
}
//飞机判断
const isFeiji = (cards) => {
    let { resultType_1, resultType_2 } = tool.getCardShowTime(cards);
    let three = resultType_2.three;
    three = three.map(item => { return resultType_1[item].card }).sort((a, b) => { return a.number - b.number; });
    let dfjCount = 0, xfjCount = 0;
    for (let i = 0; i < three.length; i++) {
        let frist = three[i];
        if (!frist) continue;
        let second = three.find(item => item.color === frist.color && item.number - frist.number === 1);
        let third = three.find(item => item.color === frist.color && item.number - frist.number === 2);
        if (second && third) {
            dfjCount = 1;
            break;
        } else if (second) {
            xfjCount++;
            frist = second = null;
            continue;
        }
    }
    return { dfjCount, xfjCount }
}
//取得每个花色组，每个组里面记录出现的所有牌型记录(二维数组)，不重复，重复的牌放在另外一个特殊数组里
const getSaveColorArr = (cards) => {
    let colors = [], lastArr = [], lastCard = { color: '', number: 0 }, grArr = [];
    cards.forEach((card, index) => {
        if (lastCard.color !== card.color) {
            if (lastCard.color !== '') {
                colors.push(clone(lastArr));
            }
            lastArr = [card];
        } else {
            if (lastCard.number !== card.number) {
                lastArr.push(card);
            } else {
                grArr.push(card);
                //与上一次一样的牌
            }
        }
        if (index + 1 === cards.length) {
            //最后一个，胡牌类型的，花色肯定不会是单个
            colors.push(clone(lastArr));
        }
        lastCard = card;
    });
    return { colors, grArr }
}
const rules = [
    //平胡1，缺一门1，基本就是2
    () => {
        return { name: '缺一门', multiple: 2 };
    },
    //是否有中发白
    ({ cards }) => {
        let result = 0, name = [];
        if (cards.allCards.filter(card => card.color === 'hz').length >= 3) { name.push('三红中'); result++; }
        if (cards.allCards.filter(card => card.color === 'fc').length >= 3) { name.push('三发财'); result++; }
        if (cards.allCards.filter(card => card.color === 'bb').length >= 3) { name.push('三白板'); result++; }
        return { name: name.join(','), multiple: result };
    },
    //板子、飞机
    ({ cards }) => {
        //大飞机、小飞机、大板子、小板子
        const noSamesCards = tool.getSames(cards.fullHandCards);
        let { resultType_1, resultType_2 } = tool.getCardShowTime(noSamesCards);
        const threeGroupCount = resultType_2.three.length;
        let name = '', multiple = 0;
        const getResult = (dcount, xcount, _name) => {
            name += dcount !== 0 ? `大${_name}×${dcount}` : '';
            name += xcount !== 0 ? `小${_name}×${xcount}` : '';
            multiple += dcount * 5 + xcount;
        }
        if (threeGroupCount <= 1) {
            //只可能存在板子
            const { dbzCount, xbzCount } = isBanzi(cards.allCards);
            getResult(dbzCount, xbzCount, '板子');
        } else if (threeGroupCount === 2) {
            const { dfjCount, xfjCount } = isFeiji(cards.allCards);
            getResult(dfjCount, xfjCount, '飞机');
            //可能还存在板子
            const { dbzCount, xbzCount } = isBanzi(cards.allCards);
            getResult(dbzCount, xbzCount, '板子');
        } else if (threeGroupCount >= 3) {
            //不可能存在板子，只可能存在飞机
            const { dfjCount, xfjCount } = isFeiji(cards.allCards);
            getResult(dfjCount, xfjCount, '飞机');
        }
        return { name: name, multiple: multiple }
    },
    //门清（没有碰和杠）
    ({ cards }) => {
        if (cards.groupCards.meet.length === 0 && cards.groupCards.fullMeet.length === 0) {
            return { name: '门清', multiple: 1 }
        }
        return { name: '', multiple: 0 }
    },
    //卡边（金钩）吊、卡心五（只有一个叫）
    ({ cards }) => {
        if (cards.handCards.length === 1) {
            if (cards.handCards[0].number === 5) return { name: '金钩吊(卡心五)', multiple: 6 }
            return { name: '金钩吊', multiple: 5 }
        }
        //要验证的牌（除去缺的牌）
        let validateCards = [];
        let colorArr = [];
        let winCount = [];
        cards.allCards.forEach(card => {
            if (card.color.length === 1 && colorArr.indexOf(card.color) === -1) {
                colorArr.push(card.color);
            }
        });
        colorArr.forEach(color => {
            for (let i = 1; i <= 9; i++) { validateCards.push({ key: color + i, number: i, color: color }); }
        });
        ['hz', 'fc', 'bb'].forEach((color, i) => {
            validateCards.push({ key: color + i, number: 1, color: color });
        });
        for (let i = 0; i < validateCards.length; i++) {
            const _cards = cards.handCards.concat(validateCards[i]);
            if (winCore(_cards)) winCount.push(validateCards[i]);
            if (winCount.length === 2) return { name: '', multiple: 0 };
        }
        if (winCount.length === 1) {
            if (winCount[0].number === 5) {
                return { name: '卡边吊(卡心五)', multiple: 2 }
            } else {
                return { name: '卡边吊', multiple: 1 }
            }
        }
        return { name: '', multiple: 0 }
    },
    //小三元
    ({ cards }) => {
        let { resultType_1, resultType_2 } = tool.getCardShowTime(cards.allCards);
        if (resultType_1.hz0 && resultType_1.bb0 && resultType_1.fc0) {
            if (resultType_1.hz0.count >= 2 && resultType_1.bb0.count >= 2 && resultType_1.fc0 == fc0.count >= 2) {
                return { name: '小三元', multiple: 5 }
            }
        }
        return { name: '', multiple: 0 }
    },
    //大对子(手牌全是3个，加一对)
    ({ cards }) => {
        let { resultType_2 } = tool.getCardShowTime(cards.fullHandCards);
        if (resultType_2.one.length === 0 && resultType_2.four.length === 0 && resultType_2.two.length === 1 && resultType_2.three.length >= 1) {
            return { name: '大对子', multiple: 5 }
        }
        return { name: '', multiple: 0 }
    },
    //暗杠
    ({ cards }) => {
        //2颗，字牌为3颗
        let { resultType_1, resultType_2 } = tool.getCardShowTime(cards.fullHandCards);
        let multiple = 0;
        resultType_2.four.forEach(item => {
            multiple += multiple + resultType_1[item].card.color.length === 1 ? 2 : 3;
        });
        return { name: '暗杠×' + resultType_2.four.length, multiple: multiple }
    },
    //明杠
    ({ cards }) => {
        //字牌为2颗
        let multiple = 0;
        cards.groupCards.fullMeet.forEach(arr => {
            multiple += multiple + arr[0].color.length;
        });
        return { name: '明杠×' + cards.groupCards.fullMeet.length, multiple: multiple }
    },
    //一条龙
    ({ cards }) => {
        let { colors, grArr } = getSaveColorArr(cards.allCards);
        // console.log(colors);
        // console.log(grArr);
        if (colors.filter(arr => arr.length === 9).length === 1) {
            colors.filter(arr => arr.length !== 9).forEach(arr => {
                grArr = grArr.concat(arr);
            });
            //存在1~9的同花色牌，这是首要条件，再验证剩下的牌是否是组
            const remainCard = tool.getSames(grArr);//去掉靠子，返回的如果还存在单牌，那么就不成立
            const { resultType_2 } = tool.getCardShowTime(remainCard);
            if (resultType_2.one.length === 0) {
                return { name: '一条龙', multiple: 5 }
            }
        }
        return { name: '', multiple: 0 }
    },
    //暗(龙)七对
    ({ cards }) => {
        let { resultType_1, resultType_2 } = tool.getCardShowTime(cards.fullHandCards);
        if (resultType_2.one.length === 0 && resultType_2.three.length === 0 && cards.fullHandCards.length === 14) {
            for (let i in resultType_1) {
                if (resultType_1[i].count === 4 && resultType_1[i].card.color === cards.groupCards.winCard.color && resultType_1[i].card.number === cards.groupCards.winCard.number) {
                    return { name: '龙七对', multiple: 10 }
                }
            }
            return { name: '暗七对', multiple: 5 }
        }
        return { name: '', multiple: 0 }
    },
    //清一色
    ({ cards }) => {
        let result = { name: '', multiple: 0 };
        let { colors, grArr } = getSaveColorArr(cards.allCards);
        if (colors.length === 1) {
            result = { name: '纯清一色', multiple: 10 }
        } else {
            const _d = colors.filter(arr => arr[0].color.length === 1);//获取color是一位数的数量
            if (_d.length === 1) {
                result = { name: '清一色', multiple: 5 }
            }
        }
        return result;
    },
    //大三元
    ({ cards }) => {
        let { resultType_1, resultType_2 } = tool.getCardShowTime(cards.allCards);
        if (resultType_1.hz0 && resultType_1.bb0 && resultType_1.fc0) {
            if (resultType_1.hz0.count >= 3 && resultType_1.bb0.count >= 3 && resultType_1.hz == fc0.count >= 3) {
                return { name: '大三元', multiple: 0 }//大三元是在计算完之后乘以2，这里先给0
            }
        }
        return { name: '', multiple: 0 }
    }
]
const actions = [
    {
        code: 'triggerWin',
        name: '点炮',
        multiple: 0
    }, {
        code: 'selfWin',
        name: '自摸',
        multiple: 1
    }, {
        code: 'beginWin',
        name: '天胡',
        multiple: 5//天胡算自摸，一颗
    }, {
        code: 'endWin',
        name: '海底',
        multiple: 5
    }, {
        code: 'fullMeetWin',
        name: '杠上花',
        multiple: 5
    }, {
        code: 'fullMeetLose',
        name: '杠上炮',
        multiple: 5
    }, {
        code: 'robFullMeetWin',//被抢杠的人输分翻番
        name: '抢杠',
        multiple: 5
    },
]
const trggleAction = (handCards, group, actionName) => {
    let result = [], allMultipl = 0;
    let _handCards = handCards.concat(group.winCard);
    let allCards = tool.concatCard(_handCards, group);//handCards.concat(compCard);
    //let { resultType_1, resultType_2 } = tool.getCardShowTime(allCards);
    //const res = tool.getSames(allCards);
    let action = actions.find(item => item.code === actionName);
    allMultipl += action.multiple;
    rules.forEach(item => {
        const ruleResult = item({ cards: { allCards: allCards, handCards: handCards, fullHandCards: _handCards, groupCards: group } });
        if (ruleResult.multiple) {
            allMultipl += ruleResult.multiple;
            result.push(ruleResult);
        }
    });
    if (result.find(item => item.name === '大三元')) {
        allMultipl = allMultipl * 2;
    }
    //console.log(result);
    return { action, result, allMultipl };
}
// console.log(get(thisCards, {
//     meet: [],
//     fullMeet: [],
//     winCard: thisCompCard
// }));

module.exports = { trggleAction, option: { zfb: true, ruleName: '广安麻将' } };