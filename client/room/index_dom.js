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
                state: 'wait'
            },
            roomId: getQueryString('roomId'),
            roomLog: [],
            room: null,
            game: null,
            activeCard: ''
        }
        //const roomId = getQueryString('roomId');
        this.ready = this.ready.bind(this);
        this.showCard = this.showCard.bind(this);
        this.ws = io('ws://localhost:3300/');

    }
    componentDidMount() {

        const self = this;
        this.ws.on('connect', function () {
            self.ws.emit('checkin', JSON.stringify({
                user: self.state.user,
                roomId: self.state.roomId,
                option: {
                    gamerNumber: 2,
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
                    self.setState({ game: data.content });
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
        this.ws.emit('showCard', JSON.stringify({
            roomId: this.state.roomId,
            uid: this.state.user.uid,
            cardKey: this.state.activeCard
        }));
        this.setState({
            activeCard: ''
        })
    }
    render() {
        let me, otherGamers = [], getStateStr = (state) => {
            switch (state) {
                case 'wait': return '等待中'; break;
                case 'ready': return '已准备就绪'; break;
            }
        }, getColorName = (number, color) => {
            let _number, _color;
            _number = ["一", "二", "三", "四", "五", "六", "七", "八", "九"][number - 1];
            switch (color) {
                case 't': _color = '条'; break;
                case 'b': _color = '筒'; break;
                case 'w': _color = '万'; break;
            }
            return _number + _color;
        }, leftGamer, topGamer, rightGamer;
        if (this.state.room) {
            me = this.state.room.gamers.filter(gamer => gamer.uid === this.state.user.uid)[0];
            otherGamers = this.state.room.gamers.filter(gamer => gamer.uid !== this.state.user.uid);
            leftGamer = otherGamers.length == 1 && otherGamers[0];
            topGamer = otherGamers.length == 2 && otherGamers[1];
            rightGamer = otherGamers.length == 3 && otherGamers[2];
        }
        const ready = <button onClick={() => this.ready('ready')}>准备开始</button>;
        const cancleReady = <button onClick={() => this.ready('wait')}>取消开始</button>;
        const showCard = <button className={this.state.activeCard ? 'active' : 'hide'} onClick={this.showCard}>出牌</button>;
        return this.state.room ?
            <div className='wrapper'>
                <div className='dockBottom'>
                    <div className='userDock'>
                        <img src='/images/games/majiang/head.jpg' />
                        <div>{me.name}</div>
                    </div>

                    {this.state.game ? <div className='cardsListWrap'>
                        {this.state.game.gameState['user_' + me.uid].cards.map(item =>
                            <span
                                style={{ background: `url(/images/games/majiang/cards/${item.color}${item.number}.png)` }}
                                key={item.key}
                                onClick={() => { this.setState({ activeCard: (this.state.activeCard === item.key ? '' : item.key) }) }}
                                className={this.state.activeCard === item.key ? 'active' : ''}
                                title={getColorName(item.number, item.color)}>
                            </span>)}
                    </div> : ''}
                    <div className='operateWrap'>
                        {this.state.game ? '' : (me.state == 'wait' ? ready : cancleReady)}
                        {this.state.game ? showCard : ''}
                    </div>
                    <div className='outCardsWrap'>
                        {this.state.game ? this.state.game.gameState['user_' + me.uid].outCards.map(item =>
                            <span
                                style={{ background: `url(/images/games/majiang/cards/${item.color}${item.number}.png)` }}
                                key={`out_${item.key}`}
                                title={getColorName(item.number, item.color)}>
                            </span>) : ''}
                    </div>
                </div>
                <div className='dockLeft'>
                    {leftGamer ?
                        <div className='userDock'>
                            <img src='/images/games/majiang/head.jpg' />
                            <div>{leftGamer.name}</div>
                            <div>{getStateStr(leftGamer.state)}</div>
                        </div> : '...'}
                    {this.state.game ? <div className='cardsListWrap'>
                        {(() => {
                            let result = [];
                            for (let i = 0; i < +this.state.game.gameState['user_' + leftGamer.uid].cards; i++) {
                                result.push(<span key={i} style={{ background: `url(/images/games/majiang/cards/side.png)` }}></span>)
                            }
                            return result;
                        })()}
                    </div> : ''}
                    <div className='outCardsWrap'>
                        {this.state.game ? this.state.game.gameState['user_' + leftGamer.uid].outCards.map(item =>
                            <span
                                style={{ background: `url(/images/games/majiang/cards/${item.color}${item.number}.png)` }}
                                key={`out_${item.key}`}
                                title={getColorName(item.number, item.color)}>
                            </span>) : ''}
                    </div>
                </div>
                <div className='dockCenter'>
                    {this.state.room ? (this.state.room.state === 'wait' && this.state.roomLog.map((log, i) => <p key={i}>{log}</p>)) : ''}
                </div>
                <div className='dockRight'>
                    {otherGamers[1] ? <div><span>{otherGamers[1].name}</span> | <span>{getStateStr(otherGamers[1].state)}</span></div> : '...'}
                </div>
                <div className='dockTop'>
                    {otherGamers[2] ? <div><span>{otherGamers[2].name}</span> | <span>{getStateStr(otherGamers[2].state)}</span></div> : '...'}
                </div>
            </div> : 'loading'
    }
}
render(
    <Room />,
    document.getElementById('layout')
)