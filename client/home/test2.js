import clone from 'clone';
//{color:'fc',number:0,key:'fc-1'}//发财
//{color:'hz',number:0,key:'hz-1'}//红中
//{color:'bb',number:0,key:'bb-1'}//白板
const thisCards = [
    { color: 't', number: 1, key: 't-1-1' }, { color: 't', number: 1, key: 't-1-2' }, { color: 't', number: 1, key: 't-1-3' },
    { color: 't', number: 2, key: 't-2-1' }, { color: 't', number: 2, key: 't-2-2' }, { color: 't', number: 2, key: 't-2-3' },
    { color: 't', number: 3, key: 't-2-1' }, { color: 't', number: 3, key: 't-3-2' }, { color: 't', number: 3, key: 't-3-3' },
    { color: 'w', number: 3, key: 'w-3-1' }, { color: 'w', number: 4, key: 'w-4-1' }, { color: 'w', number: 5, key: 'w-5-1' },
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
const isAllGroup = (cards) => {
    let { resultType_1, resultType_2 } = getCardShowTime(cards);
    if (resultType_2.one.length === 0) {
        //如果没有耍单的牌，直接通过
        return true;
    } else {
        //取得耍单的牌，看是否能组成连子，有的话抽出3个，如果剩下的还有单，那么再抽，直到没有单
        let copy_cards = clone(cards);
        const keBijiao = (_card) => {
            let frist, second;
            frist = copy_cards.find(card => card.color === _card.color && card.number - _card.number == 1);
            if (frist) {
                second = copy_cards.find(card => card.color === frist.color && card.number - frist.number == 1);
            }
            if (frist && second) {
                //如果有靠的，那么清除掉这三个，继续走
                copy_cards = copy_cards.filter(card => (card.key !== frist.key && card.key !== second.key));
                let { resultType_1, resultType_2 } = getCardShowTime(copy_cards);
                if (resultType_2.one.length !== 0) {
                    keBijiao(resultType_1[resultType_2.one[0]].type);
                } else {
                    return copy_cards;
                }
            } else {
                //不能胡牌
                return copy_cards;
            }
        }
        let { resultType_1, resultType_2 } = getCardShowTime(cards);
        if (resultType_2.one.length === 0) {
            //没有单牌
            return cards;
        }else{
            keBijiao(resultType_1[resultType_2.one[0]].type);
        }
        return false;
    }
}

const rules = [
    {
        name: '缺一门', rule: () => {
            //平胡1，缺一门1，基本就是2
            return 2;
        }
    },
    {
        name: '字牌', rule: ({ cards }) => {
            let result = 0;
            if (cards.allCards.filter(card => card.color === 'hz').length >= 3) result++;
            if (cards.allCards.filter(card => card.color === 'fc').length >= 3) result++;
            if (cards.allCards.filter(card => card.color === 'bb').length >= 3) result++;
            return result;
        }
    },
    {
        name: '板子', multiple: 1, rule: ({ handCard, cardsTime1, cardsTime2 }) => {
            //223344、778899,去cardsTime2的two、three、four去找，有的话扣除
            //去掉所有的靠，剩下的
        }
    }
]
const get = (cards, compCard) => {
    let result = [];
    //let allCards = concatCard(cards, compCard);//先不考虑组牌
    let allCards = cards.concat(compCard);
    let { resultType_1, resultType_2 } = getCardShowTime(cards);
    debugger
    const res = isAllGroup(allCards);
    rules.forEach(item => {
        if (item.rule({ cards: { allCards: allCards, handCard: cards, compCard: compCard, groupCards: [] }, cardsTime1: resultType_1, cardsTime2: resultType_2 })) {
            result.push({
                code: item.code,
                name: item.name,
                multiple: item.multiple
            });
        }
    });
}
get(thisCards, thisCompCard);