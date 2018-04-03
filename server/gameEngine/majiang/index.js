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
        this.cards = [];
    }
    init(gameState) {
        this.gameState = gameState.map(state => { return { uid: state.uid, increase: 0, cards: [], outCards: [], groupCards: [] } });
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
                    //根据图片的样子，前6个按照2.7/3.8单位走，后3个换行
                    _cards.push({ key: `card-${cardColor}-${i}-${j}`, color: cardColor, number: i });
                }
            }
        });
        const _length = _cards.length;
        getRedomCard();
    }
    regAction(socket) {
        const self = this;
        socket.on('showCard', function (_data) {
            const data = JSON.parse(_data);
            const state = self.gameState.filter(item => item.uid === data.uid)[0];
            state.outCards.push(state.cards.filter(item => item.key === data.cardKey)[0]);
            state.cards = state.cards.filter(item => item.key !== data.cardKey);
            self.sendData();
        });
    }
    sendData() {
        this.sendMsgHandler({
            gameState: this.gameState,
            remainCardNumber: this.cards.length
        });
    }
    //发牌，同时也就开始游戏了
    assignCard(callback) {
        const objectArraySort = function (keyName) {
            return function (objectN, objectM) {
                var valueN = objectN[keyName]
                var valueM = objectM[keyName]
                if (valueN < valueM) return -1
                else if (valueN > valueM) return 1
                else return 0
            }
        }
        this.gameState.forEach(state => {
            state.cards = this.cards.splice(0, 13).sort(objectArraySort('key'));
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
    // showCard(uid, card) {
    //     const state = this.gameState.filter(item => item.uid === uid)[0];
    //     state.cards = state.cards.filter(item => item.key != card.key);
    //     this.outCards.push(state.cards.filter(item => item.key === card.key)[0]);
    // }
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