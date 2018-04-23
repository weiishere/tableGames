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