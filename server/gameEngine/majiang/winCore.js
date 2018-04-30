const clone = require('clone');

module.exports = (cards) => {
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
    for (let item in group) {
        if (group[item].count === 1) singleNumber++;
        if (group[item].count >= 5) return false;//用于查觉，因为是列出所有可以查的牌，如果手牌已经有4个，这里又验证它，那么肯定是不合法的，直接return false；
    }
    //如果手上已经都没有单牌了，那么直接胡牌
    if (singleNumber === 0) {
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

// let mycards = [
//     { c: 'w', n: 1 }, { c: 'w', n: 2 }, { c: 'w', n: 3 }, { c: 'w', n: 3 }, { c: 'w', n: 4 },
//     { c: 'w', n: 5 }, { c: 't', n: 1 }, { c: 't', n: 1 }, { c: 't', n: 1 }, { c: 't', n: 5 },
//     { c: 't', n: 6 }, { c: 't', n: 7 }, { c: 't', n: 9 }, { c: 't', n: 9 }
// ]
// mycards = mycards.map((card, index) => { return { key: (card.c + card.n + index), name: (card.c + card.n), c: card.c, n: card.n } });
// getIsWin(mycards);