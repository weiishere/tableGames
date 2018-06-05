const clone = require('clone');

function objectArraySort(keyName) {
    return function (objectN, objectM) {
        var valueN = objectN[keyName]
        var valueM = objectM[keyName]
        if (valueN < valueM) return -1
        else if (valueN > valueM) return 1
        else return 0
    }
}
function concatCard(cards, groupCards) {
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
function getCardShowTime(cards) {
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
function getSames(cards) {
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

module.exports = { objectArraySort, concatCard, getCardShowTime,getSames }