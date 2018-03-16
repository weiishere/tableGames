const getRedom = require('../../util/redom');

class Majiang {
    constructor(option) {
        const _option = Object.assign({
            gameId: 1,//(new UUID()).generateUUID(),
            gameState: [
                { uid: '1', increase: 0, cards: [], groupCards: [] },
                { uid: '2', increase: 0, cards: [], groupCards: [] },
                { uid: '3', increase: 0, cards: [], groupCards: [] },
                { uid: '4', increase: 0, cards: [], groupCards: [] }
            ],
        }, option || {});
        Object.keys(_option).forEach((item) => {
            this[item] = _option[item];
        });
        this.cards = [];
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
    assignCard() {
        this.gameState.forEach(state => {
            state.cards = this.cards.splice(0, 13);
        })
    }
    fatchCard(uid) {
        const cardByCatch = this.cards.splice(0, 1)[0];
        const state = this.gameState.filter(item => item.uid === uid)[0];
        state.cards.push(cardByCatch);
        return cardByCatch;
    }
    showCard(uid, card) {
        const state = this.gameState.filter(item => item.uid === uid)[0];
        state.cards = state.cards.filter(item => item.key != card.key);
    }
}
module.exports = Majiang;