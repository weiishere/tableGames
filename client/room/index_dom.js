import React, { Component } from 'react';
import { render } from 'react-dom';
import url from 'url';
import '../reset.less';
import './style.less';
import { getQueryString } from '../util';
import { debug } from 'util';

class Room extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: {
                uid: getQueryString('uid'),
                name: getQueryString('name'),
                avatar: 'https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=1736960767,2920122566&fm=27&gp=0.jpg',
                state: 'wait'
            },
            roomId: getQueryString('roomId'),
            roomLog: [],
            room: null,
            game: null,
        }
        //const roomId = getQueryString('roomId');
        this.ready = this.ready.bind(this);
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
        };
        if (this.state.room) {
            me = this.state.room.gamers.filter(gamer => gamer.uid === this.state.user.uid)[0];
            otherGamers = this.state.room.gamers.filter(gamer => gamer.uid !== this.state.user.uid);
        }
        return this.state.room ?
            <div className='wrapper css10e99f6c6f1c375'>
                <div className='dockBottom'>
                    <div className='userDock'>
                        <img src='/images/games/majiang/head.jpg' />
                        <div>{me.name}</div>
                    </div>

                    {this.state.game ? <div className='cardsListWrap'>
                        {this.state.game.gameState['user_' + this.state.user.uid].cards.map(item => <span key={item.key}>{getColorName(item.number, item.color)}</span>)}
                    </div> : <div className='operateWrap'>{me.state == 'wait' ?
                        <button className='css10e99f6c6f1c375' onClick={() => this.ready('ready')}>准备开始</button> :
                        <button onClick={() => this.ready('wait')}>取消准备</button>}</div>}
                </div>
                <div className='dockLeft'>
                    {otherGamers[0] ? <div><span>{otherGamers[0].name}</span> | <span>{getStateStr(otherGamers[0].state)}</span></div> : '...'}
                </div>
                <div className='dockCenter'>
                    {this.state.room ? (this.state.room.state === 'wait' && this.state.roomLog.map((log, i) => <div key={i}>{log}</div>)) : ''}
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