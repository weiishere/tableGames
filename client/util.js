export function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var reg_rewrite = new RegExp("(^|/)" + name + "/([^/]*)(/|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    var q = window.location.pathname.substr(1).match(reg_rewrite);
    if (r != null) {
        return unescape(r[2]);
    } else if (q != null) {
        return unescape(q[2]);
    } else {
        return null;
    }
}
// export function getColorLack(color) {
//     let _number, _color;
//     switch (color) {
//         case 't':
//             _color = '条';
//             break;
//         case 'b':
//             _color = '筒';
//             break;
//         case 'w':
//             _color = '万';
//             break;
//     }
//     if (!number) return _color;
//     _number = ["一", "二", "三", "四", "五", "六", "七", "八", "九"][number - 1];
//     return _number + _color;
// }
export function getColorName({
    number,
    color
}) {
    let _number, _color;
    switch (color) {
        case 't':
            _color = '条';
            break;
        case 'b':
            _color = '筒';
            break;
        case 'w':
            _color = '万';
            break;
    }
    if (!number) return _color;
    _number = ["一", "二", "三", "四", "五", "六", "七", "八", "九"][number - 1];
    return _number + _color;
}
export function concatCard(state) {
    //返回所有牌的组合
    let allCards = [];//meState = this.state.game.gameState['user_' + this.state.user.uid];
    if (state.fatchCard) { allCards.push(state.fatchCard) }
    allCards = allCards.concat(state.cards);
    state.groupCards.meet.forEach(meetArr => {
        allCards = allCards.concat(meetArr);
    })
    state.groupCards.fullMeet.forEach(meetArr => {
        allCards = allCards.concat(meetArr);
    })
    return allCards;
}
export function getRedomNum(minNum, maxNum) {
    switch (arguments.length) {
        case 1: return parseInt(Math.random() * minNum + 1);
        case 2: return parseInt(Math.random() * (maxNum - minNum + 1) + minNum);
        default: return 0;
    }
}
export function isRealNum(val){
    // isNaN()函数 把空串 空格 以及NUll 按照0来处理 所以先去除
    if(val === "" || val ==null){
        return false;
    }
    if(!isNaN(val)){
        return true;
    }else{
        return false;
    }
}
export function getCardShowTime(cards) {
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