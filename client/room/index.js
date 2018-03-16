import React, { Component } from 'react';
import { render } from 'react-dom';
import url from 'url';
import '../reset.less';
import './style.less';
import { debug } from 'util';

class Room extends Component {
    constructor(props) {
        super(props);
        const user = {
            uid: this.getQueryString('uid'),
            name: this.getQueryString('name'),
            avatar: 'https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=1736960767,2920122566&fm=27&gp=0.jpg'
        }
        const roomId = this.getQueryString('roomId');
        const ws = io('ws://localhost:3300/');
        ws.on('connect', function () {
            ws.emit('checkin', JSON.stringify({
                user: user,
                roomId: roomId,
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
                    break;
                case 'notified':
                    break;
                case 'error':
                    break;
            }
            console.log(data.content);
        });
    }
    componentWillMount() {

    }
    getQueryString(name) {
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
    render() {
        return <div className='wrapper'>
            <div className='dockBottom'></div>
            <div className='dockLeft'></div>
            <div className='dockCenter'></div>
            <div className='dockRight'></div>
            <div className='dockTop'></div>
        </div>
    }
}
render(
    <Room />,
    document.getElementById('layout')
)