const getRedom = require('../../util/redom');
const UUID = require('../../util/uuid');

class Majiang {
    constructor(option) {
        const _option = Object.assign({
            gameId: (new UUID()).generateUUID(),
            gameState: [{ uid: '1' }, { uid: '2' }, { uid: '3' }, { uid: '4' }],
            // gameState: [
            //     { uid: '1', increase: 0, cards: [], groupCards: [] },
            //     { uid: '2', increase: 0, cards: [], groupCards: [] },
            //     { uid: '3', increase: 0, cards: [], groupCards: [] },
            //     { uid: '4', increase: 0, cards: [], groupCards: [] }
            // ],
        }, option || {});
        Object.keys(_option).forEach((item) => {
            this[item] = _option[item];
        });
        this.gameState = this.gameState.map(state => { return { uid: state.uid, increase: 0, cards: [], groupCards: [] } });
        this.cards = [];
        this.outCards = [];
        this.init();
    }
    init() {
        const cardColors = ['b', 't', 'w'], _cards = [],
            getRedomCard = () => {
                //const cardsLength = _cards.length;
                const redom = getRedom(0, _cards.length - 1);
                const card = _cards.splice(redom, 1)[0];
                this.cards.push(card);
                if (_cards.length != 0) getRedomCard();
            };
        cardColors.forEach(cardColor => {
            for (let i = 1; i <= 9; i++) {
                for (let j = 1; j <= 4; j++) {
                    _cards.push({ key: `card-${cardColor}-${i}-${j}`, color: cardColor, number: i });
                }
            }
        });
        const _length = _cards.length;
        getRedomCard();
    }
    sendData() {
        this.sendMsgHandler({
            gameState: this.gameState,
            outCards: this.outCards,
            remainCardNumber: this.cards.length
        });
    }
    //发牌，同时也就开始游戏了
    assignCard(callback) {
        this.gameState.forEach(state => {
            state.cards = this.cards.splice(0, 13);
        });
        this.sendData();
    }
    //抓牌
    fatchCard(uid) {
        if (this.cards.length === 0) {
            //如果总牌数为0了，则结束游戏
            this.overHandler.call(this);
            return false;
        }
        const state = this.gameState.filter(item => item.uid === uid)[0];
        const cardByCatch = this.cards.splice(0, 1)[0];
        state.cards.push(cardByCatch);
        return cardByCatch;
    }
    //出牌
    showCard(uid, card) {
        const state = this.gameState.filter(item => item.uid === uid)[0];
        state.cards = state.cards.filter(item => item.key != card.key);
        this.outCards.push(state.cards.filter(item => item.key === card.key)[0]);
    }
    setBegin(fn) {
        this.beginHandler = fn;
    }
    setOverHander(fn) {
        this.overHandler = fn;
    }
    setSendMsg(fn) {
        this.sendMsgHandler = fn;
    }
}
module.exports = Majiang;