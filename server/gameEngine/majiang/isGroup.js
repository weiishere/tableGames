const clone = require('clone');

//用于判定是否所有的牌都可以成组
module.exports = (cards) => {
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
    //如果牌组全部是2个以上的组合，直接通过
    
}

// let mycards = [
//     { c: 'w', n: 1 }, { c: 'w', n: 2 }, { c: 'w', n: 3 }, { c: 'w', n: 3 }, { c: 'w', n: 4 },
//     { c: 'w', n: 5 }, { c: 't', n: 1 }, { c: 't', n: 1 }, { c: 't', n: 1 }, { c: 't', n: 5 },
//     { c: 't', n: 6 }, { c: 't', n: 7 }, { c: 't', n: 9 }, { c: 't', n: 9 }
// ]
// mycards = mycards.map((card, index) => { return { key: (card.c + card.n + index), name: (card.c + card.n), c: card.c, n: card.n } });
// getIsWin(mycards);