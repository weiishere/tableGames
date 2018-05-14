import clone from 'clone';
//{color:'fc',number:0,key:'fc-1'}//发财
//{color:'hz',number:0,key:'hz-1'}//红中
//{color:'bb',number:0,key:'bb-1'}//白板
// const thisCards = [
//     { color: 't', number: 1, key: 't-1-1' }, { color: 't', number: 1, key: 't-1-2' }, { color: 't', number: 1, key: 't-1-3' },
//     { color: 't', number: 1, key: 't-1-4' }, { color: 't', number: 2, key: 't-2-2' }, { color: 't', number: 2, key: 't-2-3' },
//     { color: 't', number: 3, key: 't-3-1' }, { color: 't', number: 3, key: 't-3-2' }, { color: 't', number: 3, key: 't-3-3' },
//     { color: 'w', number: 3, key: 'w-3-1' }, { color: 'w', number: 4, key: 'w-4-1' }, { color: 'w', number: 5, key: 'w-5-1' },
//     { color: 'w', number: 9, key: 'w-9-1' }
// ];
const thisCards = [
    { color: 't', number: 1, key: 't-1-1' }, { color: 't', number: 1, key: 't-1-2' }, { color: 't', number: 2, key: 't-2-1' },
    { color: 't', number: 2, key: 't-2-2' }, { color: 't', number: 3, key: 't-3-1' }, { color: 'w', number: 6, key: 'w-6-3' },
    { color: 'w', number: 6, key: 't-6-1' }, { color: 'w', number: 6, key: 't-6-2' }, { color: 'w', number: 7, key: 't-7-1' },
    { color: 'w', number: 7, key: 'w-7-2' }, { color: 'w', number: 8, key: 'w-8-1' }, { color: 'w', number: 8, key: 'w-8-2' },
    { color: 'w', number: 9, key: 'w-9-1' }
];


const thisCompCard = { color: 'w', number: 9, key: 'w-9-2' };
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

const rules = [
    () => {
        //平胡1，缺一门1，基本就是2
        return { name: '缺一门', multiple: 2 };
    },
    ({ cards }) => {
        let result = 0, name = [];
        if (cards.allCards.filter(card => card.color === 'hz').length >= 3) { name.push('三红中'); result++; }
        if (cards.allCards.filter(card => card.color === 'fc').length >= 3) { name.push('三发财'); result++; }
        if (cards.allCards.filter(card => card.color === 'bb').length >= 3) { name.push('三白板'); result++; }
        return { name: name.join(','), multiple: result };
    },
    ({ cards }) => {
        //大飞机、小飞机、大板子、小板子
        //223344、778899,去cardsTime2的two、three、four去找，有的话扣除
        let result;
        const noSamesCards = getSames(cards.allCards);
        //有无大飞机
        let { resultType_1, resultType_2 } = getCardShowTime(noSamesCards);
        let threeAndFour = clone(resultType_2.three.concat(resultType_2.four));
        threeAndFour = threeAndFour.map(item => { return resultType_1[item].card }).sort((a, b) => {
            return a.number - b.number;
        });
        let _length = threeAndFour.length;
        for (let i = 0; i < _length; i++) {
            const _item = threeAndFour[i];
            const second = threeAndFour.find(item => item.color === _item.color && item.number - _item.number === 1);
            const third = threeAndFour.find(item => item.color === _item.color && item.number - _item.number === 2);
            if (second && third) {
                //大飞机只可能有一个，所以一旦存在，直接走
                return { name: '大飞机', multiple: 5 };
            }
        }
        //判断小飞机（可能有多个）
        let count = 0;
        for (let i = 0; i < _length; i++) {
            if (threeAndFour[i] === null) continue;
            let _item = threeAndFour[i];
            let second = threeAndFour.find(item => item.color === _item.color && item.number - _item.number === 1);
            if (second) {
                //这里不能清除，清除之后，下一次i+1，那么从第二个开始，第一个就被跳过了，这里设置为null
                //threeAndFour = threeAndFour.filter(item => item.key !== _item.key && second.key !== item.key);
                _item = second = null;
                count++;
            }
        }
        //如果大小飞机都不是，才再说板子的事情，因为大飞机也可以判断为是板子，但是不能既是大飞机又是板子
        let twoAndThreeAndFour = clone(threeAndFour.concat(resultType_2.two.map(item => { return resultType_1[item].card })));
        if (twoAndThreeAndFour.filter(item => item !== null).length < 3) {
            //如果牌组都小于3了，就不用判断板子了，小板子都需要3对牌
            return { name: '小飞机', multiple: count };
        } else {
            result = count === 0 ? { name: '', multiple: 0 } : { name: '小飞机', multiple: count };
            //判断大飞机(只可能有一个)

            twoAndThreeAndFour = twoAndThreeAndFour.sort((a, b) => { return a.number - b.number; });
            let _length2 = twoAndThreeAndFour.length;
            if (_length2 >= 3) {
                let count2 = 0;
                for (let i = 0; i < _length2; i++) {
                    if (twoAndThreeAndFour[i] === null) continue;
                    let _item = twoAndThreeAndFour[i];
                    let second = twoAndThreeAndFour.find(item => item.color === _item.color && item.number - _item.number === 1);
                    let third = twoAndThreeAndFour.find(item => item.color === _item.color && item.number - _item.number === 2);
                    let fourth = twoAndThreeAndFour.find(item => item.color === _item.color && item.number - _item.number === 3);
                    //先判断大飞机
                    if (second && third && fourth) {
                        //大板子只可能有一个
                        result.name += '大板子';
                        result.multiple += 5;
                        if (resultType_1[_item.color + _item.number].count !== 4) _item = null;//4个的不要设置为null，可能还有剩余两个，可以组成其他板子，3个的就不说了，肯定不能再组合了
                        if (resultType_1[second.color + second.number].count !== 4) second = null;
                        if (resultType_1[third.color + third.number].count !== 4) third = null;
                        if (resultType_1[fourth.color + fourth.number].count !== 4) fourth = null;
                        continue;
                    }
                    //再来小飞机(可能有多个小飞机)
                    if (second && third) {
                        _item = second = third = null;
                        count2++;
                    }
                }
                if (count2 !== 0) {
                    result.name += '小板子';
                    result.multiple += 1;
                }
            } else {
                //组合牌小于3个，肯定什么都不是啊
            }
        }
        return result;
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