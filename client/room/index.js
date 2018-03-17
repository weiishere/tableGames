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
        const user = {
            uid: getQueryString('uid'),
            name: getQueryString('name'),
            avatar: 'https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=1736960767,2920122566&fm=27&gp=0.jpg',
            state:'wait'
        }
        this.state = {
            user: user,
            roomId: getQueryString('roomId'),
            roomLog: [],
            room: null
        }
        //const roomId = getQueryString('roomId');
        this.ready = this.ready.bind(this);

    }
    componentDidMount() {
        const ws = io('ws://localhost:3300/');
        const self = this;
        ws.on('connect', function () {
            ws.emit('checkin', JSON.stringify({
                user: self.state.user,
                roomId: self.state.roomId,
                option: {
                    gamerNumber: 4,
                    mulriple: 1,//倍数
                    score: 100,//底分
                    gameTime: 8
                }
            }));
            // if (roomId) {
            //     //加入
            //     ws.emit('join', JSON.stringify({
            //         user: user,
            //         roomId: roomId
            //     }));
            // } else {
            //     //开房
            //     ws.emit('checkin', JSON.stringify({
            //         user: user, 
            //         option: {
            //             gamerNumber: 4,
            //             mulriple: 1,//倍数
            //             score: 100,//底分
            //             gameTime: 8
            //         }
            //     }));
            // }
        });
        ws.on('message', function (msg) {
            const data = JSON.parse(msg);
            switch (data.type) {
                case 'roomData':
                    self.setState({ room: data.content });
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
    ready() {
        ws.emit('ready', JSON.stringify({
            user: user,
            roomId: this.state.roomId,
            state: 'ready'
        }));
    }
    render() {
        let me, otherGamers = [], getStateStr = (state) => {
            switch (state) {
                case 'wait':
                    return '等待中';
                    break;
            }
        };
        if (this.state.room) {
            me = this.state.room.gamers.filter(gamer => gamer.uid === this.state.user.uid)[0];
            otherGamers = this.state.room.gamers.filter(gamer => gamer.uid !== this.state.user.uid);
        }
        return this.state.room ?
            <div className='wrapper'>
                <div className='dockBottom'>
                    <span>{me.name}</span>
                    <button onClick={this.ready}>准备</button>
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