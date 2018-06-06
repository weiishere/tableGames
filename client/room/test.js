const clone = require('clone');

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
const testWin = (cards) => {
    let copy_cards = [];
    let isWin = false;
    //先做一个对象，分别记录每一张牌出现的次数
    let group = {};
    cards.forEach(card => {
        if (group[card.color + card.number]) {
            group[card.color + card.number].count += 1;
        } else {
            let obj = {
                count: 1,
                type: card
            };
            group[card.color + card.number] = obj;
        }
    });
    let singleNumber = 0;
    let twoNumber = 0;
    let threeNumber = 0;
    let fourNumber = 0;
    let lastComparentCard;
    for (let item in group) {
        if (group[item].count === 1) singleNumber++;
        if (group[item].count === 2) twoNumber++;
        if (group[item].count === 3) threeNumber++;
        if (group[item].count === 4) fourNumber++;
        if (group[item].count >= 5) return false;//用于查叫，因为是列出所有可以查的牌，如果手牌已经有4个，这里又验证它，那么肯定是不合法的，直接return false；
    }
    //如果手上已经都没有单牌了，那么要么必须是七对，或者是单吊的对子，或者大对子(后面的逻辑会验证，这里就不处理)
    if (singleNumber === 0 && (twoNumber === 7 || twoNumber === 1)) {
        return true;
    }
    //2和和3个的开始计算
    const outCard = (_card, number) => {
        let num = 0;
        copy_cards = copy_cards.filter(card => {
            if (num >= number) { return true; }
            //if (card.c === _card.c && card.n === _card.n) {
            if (card.color === _card.color && card.number === _card.number) {
                num++;
                return false;
            } else {
                return true;
            }
        });
    }
    //抽出指定牌型的连子（因为从最小的牌比较的）
    const keBijiao = (cards, index) => {
        let copy_cards = clone(cards);
        let frist, second, _card = copy_cards[index];
        if (lastComparentCard && lastComparentCard.color === _card.color && lastComparentCard.number === _card.number) {
            //跟上次比较的一样，index+1并跳过
            index++;
        } else {
            frist = copy_cards.find(card => card.color === _card.color && card.number - _card.number == 1);
            if (frist) {
                second = copy_cards.find(card => card.color === frist.color && card.number - frist.number == 1);
            }
            if (frist && second) {
                //如果有靠的，那么清除掉这三个，继续走
                copy_cards = copy_cards.filter(card => (card.key !== _card.key && card.key !== frist.key && card.key !== second.key));
            } else {
                index++;
            }
        }
        lastComparentCard = _card;
        if (copy_cards.length > index) {
            return keBijiao(copy_cards, index);
        } else {
            return copy_cards;
        }
    }
    let lianziCard = [];
    for (let item in group) {
        if (group[item].count === 1) {
            delete group[item];
        }
    }
    for (let g in group) {
        copy_cards = clone(cards);
        let duiziCard = group[g].type;
        for (let item in group) {
            //if (group[item].type.c == duiziCard.c && group[item].type.n == duiziCard.n) {
            if (group[item].type.color == duiziCard.color && group[item].type.number == duiziCard.number) {
                //抽出对(只抽一对，其他的不管)
                outCard(group[item].type, 2);
                //group[item].count -= 2;
            } else {
                // if (group[item].count === 3) {
                //     //抽出克
                //     outCard(group[item].type, 3);
                //     //group[item].count -= 3;
                // }
            }
        }
        //console.log('首先抽取的对子:' + duiziCard.number + duiziCard.color);
        //console.log(copy_cards.map(card => card.number + card.color));//抽了一个对和其他所有的克剩下的牌，做连子判断
        const tCard = copy_cards[0];
        lastComparentCard = null;
        const remainCard = keBijiao(copy_cards, 0);
        if (remainCard.length === 0) {
            isWin = true;
            break;
        } else {
            let { resultType_1, resultType_2 } = getCardShowTime(remainCard);
            if (resultType_2.one.length === 0 && resultType_2.two.length === 0 && resultType_2.three.length !== 0 && resultType_2.four.length === 0) {
                isWin = true;
                break;
            }
        }
    }
    //console.log("最终结果：" + isWin);
    return isWin;
}

const testWin3 = (cards) => {
    let copy_cards = [];
    let isWin = false;
    //先做一个对象，分别记录每一张牌出现的次数
    let group = {};
    cards.forEach(card => {
        if (group[card.color + card.number]) {
            group[card.color + card.number].count += 1;
        } else {
            let obj = {
                count: 1,
                type: card
            };
            group[card.color + card.number] = obj;
        }
    });
    let singleNumber = 0;
    let twoNumber = 0;
    let threeNumber = 0;
    let fourNumber = 0;
    for (let item in group) {
        if (group[item].count === 1) singleNumber++;
        if (group[item].count === 2) twoNumber++;
        if (group[item].count === 3) threeNumber++;
        if (group[item].count === 4) fourNumber++;
        if (group[item].count >= 5) return false;//用于查叫，因为是列出所有可以查的牌，如果手牌已经有4个，这里又验证它，那么肯定是不合法的，直接return false；
    }
    //如果手上已经都没有单牌了，那么要么必须是七对，或者是单吊的对子，或者大对子(后面的逻辑会验证，这里就不处理)
    if (singleNumber === 0 && (twoNumber === 7 || twoNumber === 1)) {
        return true;
    }
    //2和和3个的开始计算
    const outCard = (_card, number) => {
        let num = 0;
        copy_cards = copy_cards.filter(card => {
            if (num >= number) { return true; }
            //if (card.c === _card.c && card.n === _card.n) {
            if (card.color === _card.color && card.number === _card.number) {
                num++;
                return false;
            } else {
                return true;
            }
        });
    }
    //抽出指定牌型的连子（因为从最小的牌比较的）
    const keBijiao = (cards, index) => {
        let copy_cards = clone(cards);
        let frist, second, _card = copy_cards[index];
        frist = copy_cards.find(card => card.color === _card.color && card.number - _card.number == 1);
        if (frist) {
            second = copy_cards.find(card => card.color === frist.color && card.number - frist.number == 1);
        }
        if (frist && second) {
            //如果有靠的，那么清除掉这三个，继续走
            copy_cards = copy_cards.filter(card => (card.key !== _card.key && card.key !== frist.key && card.key !== second.key));
        } else {
            index++;
        }
        if (copy_cards.length > index) {
            return keBijiao(copy_cards, index);
        } else {
            return copy_cards;
        }
    }
    let lianziCard = [];
    for (let item in group) {
        if (group[item].count === 1) {
            delete group[item];
        }
    }
    for (let g in group) {
        copy_cards = clone(cards);
        let duiziCard = group[g].type;
        for (let item in group) {
            //if (group[item].type.c == duiziCard.c && group[item].type.n == duiziCard.n) {
            if (group[item].type.color == duiziCard.color && group[item].type.number == duiziCard.number) {
                //抽出对(只抽一对，其他的不管)
                outCard(group[item].type, 2);
                //group[item].count -= 2;
            } else {
                // if (group[item].count === 3) {
                //     //抽出克
                //     outCard(group[item].type, 3);
                //     //group[item].count -= 3;
                // }
            }
        }
        //console.log('首先抽取的对子:' + duiziCard.number + duiziCard.color);
        //console.log(copy_cards.map(card => card.number + card.color));//抽了一个对和其他所有的克剩下的牌，做连子判断
        const tCard = copy_cards[0];
        const remainCard = keBijiao(copy_cards, 0);
        if (remainCard.length === 0) {
            isWin = true;
            break;
        } else {
            let { resultType_1, resultType_2 } = getCardShowTime(remainCard);
            if (resultType_2.one.length === 0 && resultType_2.two.length === 0 && resultType_2.three.length !== 0 && resultType_2.four.length === 0) {
                isWin = true;
                break;
            }
        }
    }
    //console.log("最终结果：" + isWin);
    return isWin;
}
const testWin2 = (cards) => {
    let copy_cards = [];
    let isWin = false;
    //先做一个对象，分别记录每一张牌出现的次数
    let group = {};
    cards.forEach(card => {
        if (group[card.color + card.number]) {
            group[card.color + card.number].count += 1;
        } else {
            let obj = {
                count: 1,
                type: card
            };
            group[card.color + card.number] = obj;
        }
    });
    let singleNumber = 0;
    let twoNumber = 0;
    let threeNumber = 0;
    let fourNumber = 0;
    for (let item in group) {
        if (group[item].count === 1) singleNumber++;
        if (group[item].count === 2) twoNumber++;
        if (group[item].count === 3) threeNumber++;
        if (group[item].count === 4) fourNumber++;
        if (group[item].count >= 5) return false;//用于查叫，因为是列出所有可以查的牌，如果手牌已经有4个，这里又验证它，那么肯定是不合法的，直接return false；
    }
    //如果手上已经都没有单牌了，那么要么必须是七对，或者是单吊的对子，或者大对子(后面的逻辑会验证，这里就不处理)
    if (singleNumber === 0 && (twoNumber === 7 || twoNumber === 1)) {
        return true;
    }
    //2和和3个的开始计算
    const outCard = (_card, number) => {
        let num = 0;
        copy_cards = copy_cards.filter(card => {
            if (num >= number) { return true; }
            //if (card.c === _card.c && card.n === _card.n) {
            if (card.color === _card.color && card.number === _card.number) {
                num++;
                return false;
            } else {
                return true;
            }
        });
    }
    //抽出指定牌型的连子（因为从最小的牌比较的）
    const keBijiao = (_card) => {
        let frist, second;
        frist = copy_cards.find(card => card.color === _card.color && card.number - _card.number == 1);
        if (frist) {
            second = copy_cards.find(card => card.color === frist.color && card.number - frist.number == 1);
        }
        if (frist && second) {
            //如果有靠的，那么清除掉这三个，继续走
            copy_cards = copy_cards.filter(card => (card.key !== frist.key && card.key !== second.key));
            if (copy_cards.length === 0) {
                return true;
            } else {
                const tCard = copy_cards.splice(0, 1)[0];
                return keBijiao(tCard);
            }
        } else {
            //不能胡牌
            return false;
        }
    }
    let lianziCard = [];
    for (let item in group) {
        if (group[item].count === 1) {
            delete group[item];
        }
    }
    for (let g in group) {
        copy_cards = clone(cards);
        let duiziCard = group[g].type;
        for (let item in group) {
            //if (group[item].type.c == duiziCard.c && group[item].type.n == duiziCard.n) {
            if (group[item].type.color == duiziCard.color && group[item].type.number == duiziCard.number) {
                //抽出对(只抽一对，其他的不管)
                outCard(group[item].type, 2);
                //group[item].count -= 2;
            } else {
                if (group[item].count === 3) {
                    //抽出克
                    outCard(group[item].type, 3);
                    //group[item].count -= 3;
                }
            }
        }
        //console.log('首先抽取的对子:' + duiziCard.number + duiziCard.color);
        //console.log(copy_cards.map(card => card.number + card.color));//抽了一个对和其他所有的克剩下的牌，做连子判断
        const tCard = copy_cards.splice(0, 1)[0];
        const result = keBijiao(tCard);
        if (result) {
            isWin = true;
            break;
        }
    }
    //console.log("最终结果：" + isWin);
    return isWin;
}

let mycards = [
    { key: 'w-1-1', color: 'w', number: 1 }, { key: 'w-2-1', color: 'w', number: 2 }, { key: 'w-3-1', color: 'w', number: 3 }, { key: 'w-3-2', color: 'w', number: 3 }, { key: 'w-3-3', color: 'w', number: 3 },
    { key: 'w-4-1', color: 'w', number: 4 }, { key: 'w-4-2', color: 'w', number: 4 }, { key: 'w-5-1', color: 'w', number: 5 }, { key: 'w-5-2', color: 'w', number: 5 }, { key: 't-7-1', color: 't', number: 7 }, { key: 't-7-2', color: 't', number: 7 },
    { key: 't-8-1', color: 't', number: 8 }, { key: 't-8-2', color: 't', number: 8 }, { key: 't-8-3', color: 't', number: 8 },
]

// let mycards = [
//     { key: 't-2-1', color: 't', number: 2 }, { key: 't-2-2', color: 't', number: 2 },
//     { key: 't-3-1', color: 't', number: 3 }, { key: 't-3-2', color: 't', number: 3 }, { key: 't-4-1', color: 't', number: 4 },
//     { key: 't-4-2', color: 't', number: 4 }, { key: 't-5-1', color: 't', number: 5 }, { key: 't-6-1', color: 't', number: 6 }, 
//     { key: 't-7-1', color: 't', number: 7 }, { key: 'w-2-1', color: 'w', number: 2 },{ key: 'w-2-2', color: 'w', number: 2 },
//     { key: 'w-4-1', color: 'w', number: 4 }, { key: 'w-5-1', color: 'w', number: 5 }, { key: 'w-6-1', color: 'w', number: 6 }, 
// ]

// let mycards = [
//     { key: 't-1-1', color: 't', number: 1 }, { key: 't-1-2', color: 't', number: 1 },
//     { key: 't-1-2', color: 't', number: 1 }, { key: 't-3-1', color: 't', number: 3 }, { key: 't-4-1', color: 't', number: 4 },
//     { key: 't-5-1', color: 't', number: 5 }, { key: 'w-4-1', color: 'w', number: 4 }, { key: 'w-5-1', color: 'w', number: 5 }, 
//     { key: 'w-6-1', color: 'w', number: 6 }, { key: 'w-6-2', color: 'w', number: 6 },{ key: 'w-6-3', color: 'w', number: 6 },
//     { key: 'w-7-1', color: 'w', number: 7 }, { key: 'w-8-1', color: 'w', number: 8 }, { key: 'w-9-1', color: 'w', number: 9 }, 
// ]

debugger
const result = testWin(mycards);
const result2 = testWin3(mycards);
console.log(result);
// mycards = mycards.map((card, index) => { return { key: (card.c + card.n + index), name: (card.c + card.n), c: card.c, number: card.n } });
// getIsWin(mycards);