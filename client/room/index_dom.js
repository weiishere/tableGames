import React, { Component } from 'react';
import { render } from 'react-dom';
import url from 'url';
import '../reset.less';
import './style.less';
import { getQueryString } from '../util';
import { debug } from 'util';

document.querySelector('body').style.fontSize = `${document.body.clientWidth / 50}px`;

class Room extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: {
                uid: getQueryString('uid'),
                name: getQueryString('name'),
                //avatar: 'https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=1736960767,2920122566&fm=27&gp=0.jpg',
                avatar: '/images/games/majiang/head.jpg',
                state: 'wait',
            },
            //allowColor: 'none',//t、b、w、none、all
            roomId: getQueryString('roomId'),
            roomLog: [],
            room: null,
            game: null,
            activeCard: '',
            buttonVisible: true
        }
        //const roomId = getQueryString('roomId');
        this.isLack = false;
        this.ready = this.ready.bind(this);
        this.showCard = this.showCard.bind(this);
        this.chooseColor = this.chooseColor.bind(this);
        this.concatCard = this.concatCard.bind(this);
        this.ws = io('ws://192.168.31.222:3300/');

    }
    componentDidMount() {
        const self = this;
        this.ws.on('connect', function () {
            self.ws.emit('checkin', JSON.stringify({
                user: self.state.user,
                roomId: self.state.roomId,
                option: {
                    gamerNumber: 4,
                    colorType: 2,//表示两黄牌还是三黄牌
                    mulriple: 1,//倍数
                    score: 100,//底分
                    gameTime: 8
                }
            }));
        });
        this.ws.on('message', function (msg) {
            const data = JSON.parse(msg);
            switch (data.type) {
                case 'roomData':
                    self.setState({ room: data.content });
                    break;
                case 'gameData':
                    if (data.content) {
                        const _fatchCard = data.content.gameState['user_' + self.state.user.uid].fatchCard;
                        self.setState({ game: data.content, buttonVisible: true, activeCard: _fatchCard ? _fatchCard.key : '' });
                    } else {
                        self.setState({ game: undefined });
                    }

                    break;
                case 'notified':
                    const log = self.state.roomLog;
                    log.push(data.content);
                    self.setState({ roomLog: log });
                    break;
                case 'error':
                    break;
            }
            console.log(data.content);
        });


    }
    componentWillUpdate() {

    }
    componentWillMount() {

    }
    ready(state) {
        const self = this;
        this.ws.emit('ready', JSON.stringify({
            user: self.state.user,
            roomId: this.state.roomId,
            state: state
        }));
    }
    showCard() {
        const _me = this.state.game.gameState['user_' + this.state.user.uid];
        const _concatCard = this.concatCard();
        const _isLack = _concatCard.filter(card => card.color === this.state.game.gameState['user_' + this.state.user.uid].colorLack).length === 0 ? true : false;
        const _showCard = _concatCard.find(card => card.key === this.state.activeCard);
        if (!_me.catcher || (_me.colorLack !== _showCard.color && !_isLack)) {
            this.setState({ activeCard: '' });
            return false;
        }
        //必须在打缺了的情况下，或者打的缺花色的牌，才通过
        if (_showCard.color === _me.colorLack || this.isLack) {
            this.ws.emit('showCard', JSON.stringify({
                roomId: this.state.roomId,
                uid: this.state.user.uid,
                cardKey: this.state.activeCard
            }));
        }
        this.setState({
            activeCard: ''
        })
    }
    //选择定缺
    chooseColor(color) {
        this.ws.emit('chooseColor', JSON.stringify({
            roomId: this.state.roomId,
            uid: this.state.user.uid,
            color: color
        }));
    }
    //动作
    actionHandler(type) {
        //点击了就马上隐藏按钮，免得再多生事端
        this.setState({
            buttonVisible: false
        });
        this.ws.emit('action', JSON.stringify({
            roomId: this.state.roomId,
            uid: this.state.user.uid,
            actionType: type
        }));
    }
    concatCard() {
        //返回所有牌的组合
        let allCards = [], meState = this.state.game.gameState['user_' + this.state.user.uid];
        if (meState.fatchCard) { allCards.push(meState.fatchCard) }
        allCards = allCards.concat(meState.cards);
        meState.groupCards.meet.forEach(meetArr => {
            allCards = allCards.concat(meetArr);
        })
        meState.groupCards.fullMeet.forEach(meetArr => {
            allCards = allCards.concat(meetArr);
        })
        return allCards;
    }
    render() {
        let me, leftGamer, topGamer, rightGamer, getStateStr = (state) => {
            if (this.state.room.state !== 'wait') return '';
            switch (state) {
                case 'wait': return ''; break;
                case 'ready': return <span className='ready_ok'></span>; break;
            }
        }, getColorName = ({ number, color }) => {
            let _number, _color;
            switch (color) {
                case 't': _color = '条'; break;
                case 'b': _color = '筒'; break;
                case 'w': _color = '万'; break;
            }
            if (!number) return _color;
            _number = ["一", "二", "三", "四", "五", "六", "七", "八", "九"][number - 1];
            return _number + _color;
        }, getCardClass = ({ key, color }) => {
            let _class = this.state.activeCard === key ? 'active' : '';
            const colorLack = this.state.game.gameState['user_' + me.uid].colorLack;
            if (!colorLack ||
                (colorLack === 't' && color === 't') ||
                (colorLack === 'b' && color === 'b') ||
                (colorLack === 'w' && color === 'w')) {
                //_class += ' '
            } else {
                if (this.isLack) return _class;//如果已经缺了就不加禁用了
                _class += ' gray'
            }
            return _class;
        };
        this.isLack = this.state.game && this.concatCard().filter(card => card.color === this.state.game.gameState['user_' + this.state.user.uid].colorLack).length === 0 ? true : false;
        if (this.state.room) {
            //这里差点把我的脑子整爆，看似简单的一个玩家对号入位却相当复杂，因为要考虑玩家数小于等于4的时候，给的数据可能也是小于等于4的，如何选出当前玩家，顺时针安顿其他玩家，整惨了，用了2个多小时才搞定
            let _gamer = this.state.room.gamers;
            me = _gamer.find(gamer => gamer.uid === this.state.user.uid);
            let meIndex = _gamer.indexOf(me);
            //先取得me前面和后面的gamer
            let frontGamer = [];
            let behindGamer = [];
            _gamer.forEach((gamer, index) => {
                if (index < meIndex) { frontGamer.push(gamer); }
                if (index > meIndex) { behindGamer.push(gamer); }
            });
            leftGamer = behindGamer[0];
            topGamer = behindGamer[1];
            rightGamer = behindGamer[2];
            if (!rightGamer) rightGamer = frontGamer[frontGamer.length - 1];
            if (!topGamer) topGamer = frontGamer[frontGamer.length - 2];
            if (!leftGamer) leftGamer = frontGamer[frontGamer.length - 3];
        }
        const ready = <button onClick={() => this.ready('ready')}>准备开始</button>;
        const cancleReady = <button onClick={() => this.ready('wait')}>取消开始</button>;
        const lackColorChoose = <div>
            <div style={{ lineHeight: '2rem' }}>请选择您要缺的牌型</div>
            <span>
                <button onClick={() => this.chooseColor('b')}>筒</button>&nbsp;&nbsp;
                <button onClick={() => this.chooseColor('t')}>条</button>&nbsp;&nbsp;
                <button onClick={() => this.chooseColor('w')}>万</button>
            </span>
        </div>
        //const showCard = <button className={this.state.activeCard ? 'active' : 'hide'} onClick={this.showCard}>出牌</button>;
        const btuStyle = { margin: '0 .2rem', display: this.state.buttonVisible ? 'inline-block' : 'none' }
        const showCard = <button onClick={this.showCard}>出牌</button>;
        const meetBtu = <button style={btuStyle} key='meet' onClick={() => this.actionHandler('meet')}>碰</button>;
        const fullMeetBtu = <button style={btuStyle} key='fullMeet' onClick={() => this.actionHandler('fullMeet')}>杠</button>;
        const winBtu = <button style={btuStyle} key='winning' onClick={() => this.actionHandler('winning')}>胡牌</button>;
        const passBtu = <button style={btuStyle} key='pass' onClick={() => this.actionHandler('pass')}>过</button>;
        const fatchCard = this.state.game && this.state.game.gameState['user_' + this.state.user.uid].fatchCard;

        //获取组牌和胡的牌
        const getGroupCard = (gamer) => {
            const _meet = gamer.groupCards.meet.map((group, index) =>
                <div key={'group1_' + index} className='groupCardWrap'>{group.map(_meet => <div key={_meet.key}><span
                    style={{ background: `url(/images/games/majiang/cards/${_meet.color}${_meet.number}.png)` }}>
                </span></div>)}</div>);
            const _fullMeet = gamer.groupCards.fullMeet.map((group, index) =>
                <div key={'group2_' + index} className='groupCardWrap'>{group.map(_meet => <div key={_meet.key}><span
                    style={{ background: `url(/images/games/majiang/cards/${_meet.color}${_meet.number}.png)` }}>
                </span></div>)}</div>);
            const winCard = gamer.groupCards.winCard &&
                <div className='groupCardWrap' key='winCard'>
                    <div key={gamer.groupCards.winCard.key}>
                        <span
                            style={{ background: `url(/images/games/majiang/cards/${gamer.groupCards.winCard.color}${gamer.groupCards.winCard.number}.png)` }}>
                        </span>
                    </div>
                </div>
            return [winCard, _meet, _fullMeet]
        }

        return this.state.room ?
            <div className='wrapper'>
                <div className='dockBottom'>
                    <div className='userDock'>
                        <img src='/images/games/majiang/head.jpg' />
                        <div>{me.name}</div>
                    </div>
                    {this.state.game && <div className='cardsListWrap'>
                        {this.state.game.gameState['user_' + me.uid].cards.map(item =>
                            <span
                                style={{ background: `url(/images/games/majiang/cards/${item.color}${item.number}.png)` }}
                                key={item.key}
                                onClick={(e) => {
                                    if (e.target.className.indexOf('gray') == -1) {
                                        if (this.state.activeCard === item.key) {
                                            this.showCard();
                                        } else {
                                            //this.setState({ activeCard: (this.state.activeCard === item.key ? '' : item.key) });
                                            this.setState({ activeCard: item.key });
                                        }
                                    }

                                }}
                                className={getCardClass(item)}
                                title={getColorName(item.number, item.color)}>
                            </span>)}
                        {fatchCard ? <span
                            style={{ background: `url(/images/games/majiang/cards/${fatchCard.color}${fatchCard.number}.png)`, marginLeft: '.5rem' }}
                            key={fatchCard.key}
                            onClick={(e) => {

                                if (e.target.className.indexOf('gray') == -1) {
                                    if (this.state.activeCard === fatchCard.key) {
                                        this.showCard();
                                    } else {
                                        //this.setState({ activeCard: (this.state.activeCard === item.key ? '' : item.key) });
                                        this.setState({ activeCard: fatchCard.key });
                                    }
                                }
                                //this.setState({ activeCard: (this.state.activeCard === fatchCard.key ? '' : fatchCard.key) })
                            }}
                            className={getCardClass(fatchCard)}
                            title={getColorName(fatchCard.number, fatchCard.color)}></span> : ''}
                        {this.state.game && getGroupCard(this.state.game.gameState['user_' + me.uid])}
                    </div>}


                    <div className='operateWrap'>
                        {this.state.game ? '' : (me.state == 'wait' ? ready : cancleReady)}
                        {this.state.activeCard && this.state.game.gameState['user_' + me.uid].colorLack && this.state.game.gameState['user_' + me.uid].catcher ? showCard : ''}
                        {this.state.game && !this.state.game.gameState['user_' + me.uid].colorLack && lackColorChoose}
                        {
                            //这里可能会不显示操作面板（如果是碰，但是又有玩家要胡牌）
                            this.state.game && !this.state.game.gameState['user_' + me.uid].isPause && this.state.game.gameState['user_' + me.uid].actionCode.map(action => {
                                if (action === 'meet') return meetBtu;
                                if (action === 'fullMeet') return fullMeetBtu;
                                if (action === 'winning') return winBtu;
                            })
                        }
                        {this.state.game && !this.state.game.gameState['user_' + me.uid].isPause && this.state.game.gameState['user_' + me.uid].actionCode.length !== 0 && passBtu}
                    </div>
                    <div className='outCardsWrap'>
                        {this.state.game ? this.state.game.gameState['user_' + me.uid].outCards.map(item =>
                            <div key={`out_${item.key}`}><span
                                style={{ background: `url(/images/games/majiang/cards/${item.color}${item.number}.png)` }}
                                title={getColorName(item.number, item.color)}>
                            </span></div>) : ''}
                    </div>
                    {this.state.game &&
                        (this.state.game.gameState['user_' + me.uid].colorLack ?
                            <span className='colorLack'>缺{getColorName({ color: this.state.game.gameState['user_' + me.uid].colorLack })}</span> : '')}
                </div>
                <div className='dockLeft'>
                    {leftGamer &&
                        <div className='userDock'>
                            <img src='/images/games/majiang/head.jpg' />
                            <div>{leftGamer.name}</div>
                            <div>{getStateStr(leftGamer.state)}</div>
                        </div>}
                    {leftGamer && this.state.game && <div className='cardsListWrap'>
                        {(() => {
                            let result = [];
                            for (let i = 0; i < +this.state.game.gameState['user_' + leftGamer.uid].cards; i++) {
                                result.push(<span key={i} style={{ background: `url(/images/games/majiang/cards/side.png)` }}></span>)
                            }
                            return result;
                        })()}
                        {getGroupCard(this.state.game.gameState['user_' + leftGamer.uid])}
                    </div>}
                    <div className='outCardsWrap'>
                        {leftGamer && this.state.game ? this.state.game.gameState['user_' + leftGamer.uid].outCards.map(item =>
                            <div key={`out_${item.key}`}><span
                                style={{ background: `url(/images/games/majiang/cards/${item.color}${item.number}.png)` }}
                                title={getColorName(item.number, item.color)}>
                            </span></div>) : ''}
                    </div>

                    {(leftGamer && this.state.game) &&
                        (this.state.game.gameState['user_' + leftGamer.uid].colorLack ?
                            <span className='colorLack'>缺{getColorName({ color: this.state.game.gameState['user_' + leftGamer.uid].colorLack })}</span> : '')}
                </div>
                <div className='dockCenter'>
                    <div>
                        {this.state.room.state === 'wait' && !this.state.game && this.state.roomLog.map((log, i) => <p key={i}>{log}</p>)}
                    </div>
                </div>
                <div className='dockTop'>
                    {topGamer ?
                        <div className='userDock'>
                            <img src='/images/games/majiang/head.jpg' />
                            <div>{topGamer.name}</div>
                            <div>{getStateStr(topGamer.state)}</div>
                        </div> : '...'}
                    {topGamer && this.state.game ? <div className='cardsListWrap'>
                        {(() => {
                            let result = [];
                            for (let i = 0; i < +this.state.game.gameState['user_' + topGamer.uid].cards; i++) {
                                result.push(<span key={i} style={{ background: `url(/images/games/majiang/cards/backSide.png)` }}></span>)
                            }
                            return result;
                        })()}
                        {getGroupCard(this.state.game.gameState['user_' + topGamer.uid])}
                    </div> : ''}
                    <div className='outCardsWrap'>
                        {topGamer && this.state.game && this.state.game.gameState['user_' + topGamer.uid].outCards.map(item =>
                            <span
                                key={`out_${item.key}`}
                                style={{ background: `url(/images/games/majiang/cards/${item.color}${item.number}.png)` }}
                                title={getColorName(item.number, item.color)}>
                            </span>)}
                    </div>
                    {(topGamer && this.state.game) &&
                        (this.state.game.gameState['user_' + topGamer.uid].colorLack ?
                            <span className='colorLack'>缺{getColorName({ color: this.state.game.gameState['user_' + topGamer.uid].colorLack })}</span> : '')}
                </div>
                <div className='dockLeft dockRight'>
                    {rightGamer &&
                        <div className='userDock'>
                            <img src='/images/games/majiang/head.jpg' />
                            <div>{rightGamer.name}</div>
                            <div>{getStateStr(rightGamer.state)}</div>
                        </div>}
                    {rightGamer && this.state.game && <div className='cardsListWrap'>
                        {(() => {
                            let result = [];
                            for (let i = 0; i < +this.state.game.gameState['user_' + rightGamer.uid].cards; i++) {
                                result.push(<span key={i} style={{ background: `url(/images/games/majiang/cards/side.png)` }}></span>)
                            }
                            return result;
                        })()}
                        {getGroupCard(this.state.game.gameState['user_' + rightGamer.uid])}
                    </div>}
                    <div className='outCardsWrap'>
                        {rightGamer && this.state.game && this.state.game.gameState['user_' + rightGamer.uid].outCards.map(item =>
                            <div key={`out_${item.key}`}><span
                                style={{ background: `url(/images/games/majiang/cards/${item.color}${item.number}.png)` }}
                                title={getColorName(item.number, item.color)}>
                            </span></div>)}
                    </div>
                    {(rightGamer && this.state.game) &&
                        (this.state.game.gameState['user_' + rightGamer.uid].colorLack ?
                            <span className='colorLack'>缺{getColorName({ color: this.state.game.gameState['user_' + rightGamer.uid].colorLack })}</span> : '')}
                </div>
                {this.state.game && this.state.game.isOver && <div className='singleGameInfo'>
                    <div className='header'>结算信息</div>
                    <p>{`玩家${me.name}：`}<b className={this.state.game.gameState['user_' + me.uid].increase < 0 ? 'lose' : ''}>
                        {this.state.game.gameState['user_' + me.uid].increase < 0 ? '' : '+'}{this.state.game.gameState['user_' + me.uid].increase}</b>
                    </p>
                    {leftGamer && <p>{`玩家${leftGamer.name}：`}<b className={this.state.game.gameState['user_' + leftGamer.uid].increase < 0 ? 'lose' : ''}>
                        {this.state.game.gameState['user_' + leftGamer.uid].increase < 0 ? '' : '+'}{this.state.game.gameState['user_' + leftGamer.uid].increase}</b>
                    </p>}
                    {topGamer && <p>{`玩家${topGamer.name}：`}<b className={this.state.game.gameState['user_' + topGamer.uid].increase < 0 ? 'lose' : ''}>
                        {this.state.game.gameState['user_' + topGamer.uid].increase < 0 ? '' : '+'}{this.state.game.gameState['user_' + topGamer.uid].increase}</b>
                    </p>}
                    {rightGamer && <p>{`玩家${rightGamer.name}：`}<b className={this.state.game.gameState['user_' + rightGamer.uid].increase < 0 ? 'lose' : ''}>
                        {this.state.game.gameState['user_' + rightGamer.uid].increase < 0 ? '' : '+'}{this.state.game.gameState['user_' + rightGamer.uid].increase}</b>
                    </p>}
                    <div style={{ textAlign: 'center', marginTop: 10 }}><div>下一局（{`${this.state.room.gameTime}/${this.state.room.allTime}`}）</div>{ready}</div>
                </div>}

            </div> : 'loading'
    }
}
render(
    <Room />,
    document.getElementById('layout')
)