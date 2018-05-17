import clone from 'clone';
//{color:'fc',number:0,key:'fc-1'}//发财
//{color:'hz',number:0,key:'hz-1'}//红中
//{color:'bb',number:0,key:'bb-1'}//白板
const thisCards = [
    { color: 't', number: 1, key: 't-1-1' }, { color: 't', number: 1, key: 't-1-2' }, { color: 't', number: 1, key: 't-1-3' },
    { color: 't', number: 2, key: 't-2-1' }, { color: 't', number: 2, key: 't-2-2' }, { color: 't', number: 2, key: 't-2-3' },
    { color: 't', number: 4, key: 't-4-1' }, { color: 't', number: 4, key: 't-4-2' }, { color: 't', number: 4, key: 't-4-3' },
    { color: 't', number: 5, key: 't-5-1' }, { color: 't', number: 5, key: 't-5-2' }, { color: 't', number: 5, key: 't-5-3' },
    { color: 'w', number: 9, key: 'w-9-1' }
];

// const thisCards = [
//     { color: 't', number: 1, key: 't-1-1' }, { color: 't', number: 1, key: 't-1-2' }, { color: 't', number: 2, key: 't-2-1' },
//     { color: 't', number: 2, key: 't-2-2' }, { color: 't', number: 3, key: 't-3-1' }, { color: 'w', number: 6, key: 'w-6-3' },
//     { color: 'w', number: 6, key: 't-6-1' }, { color: 'w', number: 6, key: 't-6-2' }, { color: 'w', number: 7, key: 't-7-1' },
//     { color: 'w', number: 7, key: 'w-7-2' }, { color: 'w', number: 8, key: 'w-8-1' }, { color: 'w', number: 8, key: 'w-8-2' },
//     { color: 'w', number: 9, key: 'w-9-1' }
// ];

// const thisCards = [
//     { color: 't', number: 1, key: 't-1-1' }, { color: 't', number: 1, key: 't-1-2' },
//     { color: 't', number: 2, key: 't-2-1' }, { color: 't', number: 2, key: 't-2-2' },
//     { color: 't', number: 3, key: 't-3-1' }, { color: 't', number: 3, key: 't-3-2' },
//     { color: 't', number: 5, key: 't-5-1' }, { color: 't', number: 5, key: 't-5-2' },
//     { color: 't', number: 6, key: 't-6-1' }, { color: 't', number: 6, key: 't-6-2' },
//     { color: 't', number: 7, key: 't-7-1' }, { color: 't', number: 7, key: 't-7-2' },
//     { color: 't', number: 8, key: 't-8-1' }
// ];

const thisCompCard = { color: 'w', number: 9, key: 't-9-2' };
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

//返回去掉靠子的牌组（不存在单牌）
const getSames = (cards) => {
    let { resultType_1, resultType_2 } = getCardShowTime(cards);
    let copy_cards = clone(cards);
    if (resultType_2.one.length === 0) {
        //如果没有耍单的牌，直接通过
        return copy_cards;
    } else {
        //取得耍单的牌，看是否能组成连子，有的话抽出3个，如果剩下的还有单，那么再抽，直到没有单
        let frist, second;
        let _card = resultType_1[resultType_2.one[0]].card;
        frist = copy_cards.find(card => card.color === _card.color && card.number - _card.number == 1);
        if (frist) {
            second = copy_cards.find(card => card.color === frist.color && card.number - frist.number == 1);
        }
        if (frist && second) {
            //如果有靠的，那么清除掉这三个，继续走
            copy_cards = copy_cards.filter(card => (card.key !== _card.key && card.key !== frist.key && card.key !== second.key));
            let { resultType_1, resultType_2 } = getCardShowTime(copy_cards);
            if (resultType_2.one.length !== 0) {
                return getSames(copy_cards);
            } else {
                return copy_cards;
            }
        } else {
            //严格说，不应该存在这种情况（引入传入的牌组就应该是已经可以胡牌的牌型）
            return copy_cards;
        }
    }
}
//板子判断
const isBanzi = (cards) => {
    let { resultType_1, resultType_2 } = getCardShowTime(cards);
    let twos = resultType_2.two;
    resultType_2.four.forEach(item => {
        twos.push(item);
        twos.push(item);//分解成2个
    });
    twos = twos.map(item => { return resultType_1[item].card }).sort((a, b) => { return a.number - b.number; });
    let dbzCount = 0, xbzCount = 0;
    for (let i = 0; i < twos.length; i++) {
        const frist = twos[i];
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
    let { resultType_1, resultType_2 } = getCardShowTime(cards);
    let three = resultType_2.three;
    three = three.map(item => { return resultType_1[item].card }).sort((a, b) => { return a.number - b.number; });
    let dfjCount = 0, xfjCount = 0;
    for (let i = 0; i < three.length; i++) {
        const frist = three[i];
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
        const noSamesCards = getSames(cards.allCards);
        let { resultType_1, resultType_2 } = getCardShowTime(noSamesCards);
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
        if (cards.groupCards.length === 0) {
            return { name: '门清', multiple: 1 }
        }
        return { name: '', multiple: 0 }
    }
]
const get = (cards, compCard) => {
    let result = [];
    //let allCards = concatCard(cards, compCard);//先不考虑组牌
    let allCards = cards.concat(compCard);
    let { resultType_1, resultType_2 } = getCardShowTime(cards);
    const res = getSames(allCards);
    rules.forEach(item => {
        const ruleResult = item({ cards: { allCards: allCards, handCard: cards, compCard: compCard, groupCards: [] }, cardsTime1: resultType_1, cardsTime2: resultType_2 });
        if (ruleResult.multiple) {
            result.push(ruleResult);
        }
    });
    return result;
}
console.log(get(thisCards, thisCompCard));