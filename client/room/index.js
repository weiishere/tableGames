import React, { Component } from 'react';
import { render } from 'react-dom';
import url from 'url';
import clone from 'clone';
import '../reset.less';
import './style2.less';
import { getQueryString, getColorName, concatCard, getRedomNum, isRealNum, getCardShowTime } from '../util';
import loadImage from 'image-promise';
import QueueAnim from 'rc-queue-anim';
import Cookies from "js-cookie";
import $ from 'jquery';
import PropTypes from 'prop-types';
import cardsImages from './image';
//import './test';
//import wechatConfig from '../wxConfig';
const playerNumber = 4;
const axios = require('axios');
String.prototype.trim = function () {
    return this.replace(/(^\s*)|(\s*$)/g, '');
};
let isBegin = false;
let scoketDone = false;
let newRecore = false;
let disableSound = false;
let bgMusicDisable = false;
let ruleName = '';
let shareDesc = '';

const bgPlay = () => {
    const bgAudio = document.getElementById('bgMusic');
    if (bgAudio.paused) {
        bgAudio.play();
        bgMusicDisable = false;
    } else {
        bgAudio.pause();
        bgMusicDisable = true;
    }
}
const playSound = (type) => {
    if (!disableSound) {
        document.getElementById(type) && document.getElementById(type).play();
    }
}
var u = navigator.userAgent;
var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; //android终端
var isIOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
const isDebug = process.env.NODE_ENV === 'development';
let ws = isDebug ? /*io('ws://192.168.31.222:8800')*/io('ws://localhost:8800') : io('ws://220.167.101.116:3300');

let userInfo = {
    userid: getQueryString('uid'),
    nickname: getQueryString('name') || 'player',
    headimgurl: '/images/games/majiang/head.jpg'//https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=1736960767,2920122566&fm=27&gp=0.jpg
};
document.querySelector('html').style.fontSize = `${document.body.clientWidth / 60}px`;
window.addEventListener("onorientationchange" in window ? "orientationchange" : "resize", function () {
    window.setTimeout(function () {
        document.querySelector('html').style.fontSize = `${document.body.clientWidth / 60}px`;
    }, 1000);
}, false);
window.addEventListener("orientationchange", function () {
    //console.log(window.orientation);
    document.querySelector('html').style.fontSize = `${document.body.clientWidth / 60}px`;
});
window.addEventListener("onsize", function () {
    //console.log(window.orientation);
    document.querySelector('html').style.fontSize = `${document.body.clientWidth / 60}px`;
});



if (!isDebug) {
    const userInfoCookie = Cookies.get('wxUserInfo');
    if (!userInfoCookie) {
        location.href = '/auth?target=' + escape('room?roomId=' + getQueryString('roomId'));
    } else {
        userInfo = JSON.parse(userInfoCookie);
        userInfo.nickname = decodeURI(userInfo.nickname);
        //alert(userInfoCookie);
        if (!getQueryString('roomId')) {
            //location.href = '/auth?target=' + escape('playing?uid=' + userInfo.userid);
            location.href = 'playing?uid=' + userInfo.userid;
        }
    }
    axios.get('/wechat/ticket?page=' + location.href, {}).then((req) => {
        //alert('ticket ready OK');
        scoketDone = true;
        const data = req.data;
        if (window.hasOwnProperty('wx')) {
            wx.config({
                debug: false,
                appId: data.appId,
                timestamp: data.timestamp,
                nonceStr: data.noncestr,
                signature: data.signature,
                jsApiList: ['onMenuShareTimeline', 'onMenuShareAppMessage', 'getLocation']
            });
            wx.ready(function () {
                wx.onMenuShareAppMessage({
                    title: '麻友们邀您来战' + ruleName + '【房间号：' + getQueryString('roomId') + '】',
                    desc: '您准备好了吗？戳我直接开始游戏-掌派桌游',
                    link: location.href,
                    imgUrl: 'http://www.fanstongs.com/images/games/majiang2/logo.jpeg',
                    success: function () {
                        //alert('success');
                    }
                });
                wx.getLocation({
                    type: 'wgs84', // 默认为wgs84的gps坐标，如果要返回直接给openLocation用的火星坐标，可传入'gcj02'
                    success: function (res) {
                        var latitude = res.latitude; // 纬度，浮点数，范围为90 ~ -90
                        var longitude = res.longitude; // 经度，浮点数，范围为180 ~ -180。
                        var speed = res.speed; // 速度，以米/每秒计
                        var accuracy = res.accuracy; // 位置精度
                        userInfo.location = {
                            latitude, longitude
                        }
                    }
                });
            });

        }
    });
} else {
    scoketDone = true;
    if (!getQueryString('roomId')) {
        location.href = '/playing?uid=' + getQueryString('uid');
    } else {
        userInfo.location = {
            latitude: 0, longitude: 0
        }
    }
}




class Table extends Component {
    constructor(props) {
        super(props);
        //alert(userInfo.nickname);
        //alert(decodeURIComponent(userInfo.nickname));
        this.state = {
            user: {
                uid: userInfo.userid,//getQueryString('uid'),
                name: userInfo.nickname,//getQueryString('name'),
                //avatar: 'https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=1736960767,2920122566&fm=27&gp=0.jpg',
                avatar: userInfo.headimgurl,//'/images/games/majiang/head.jpg',
                keepVertical: false,
                state: 'wait',
                effectShow: ''
            },
            //roomId: getQueryString('roomId'),
            error: null,
            errorInfo: null,
            roomLog: [],
            room: null,
            game: null,
            activeCard: null,
            newState: true,
            isBegin: false,
            showRecore: false,
            showHelpPanel: '0',
            isFristLoad: true,
            isConnectting: false,
            option: {},
            toast: '',
            notice: false
        }
        this.isFristLoad = true;
        this.countdown = 60;
        this.ruleName = '';
        this.gameInit = this.gameInit.bind(this);
        this.gameInfoCloseHandle = this.gameInfoCloseHandle.bind(this);
        this.gameInfoOpenHandle = this.gameInfoOpenHandle.bind(this);
        this.readyCallback = this.readyCallback.bind(this);
        this.showCardAuto = this.showCardAuto.bind(this);
        this.winEventEffect = this.winEventEffect.bind(this);
        this.rainEventEffect = this.rainEventEffect.bind(this);
        this.getlocation = this.getlocation.bind(this);
        //this.heartBeat = this.heartBeat.bind(this);
        this.lastData = { isOver: false };
        this.allGamers = {}
        this.isUpdateTime = false;
        this.bgPlaying = false;
        this.isGetlocation = false;
    }
    // heartBeat({ roomId, uid }) {
    //     //心跳
    //     window.setInterval(() => {
    //         ws.emit('heartBeat', JSON.stringify({ roomId, uid }));
    //     }, 10000);
    // }
    static childContextTypes = {
        room: PropTypes.object,
        game: PropTypes.object
    }
    getChildContext() {
        return {
            room: this.state.room,
            game: this.state.game,
        }
    }
    componentDidMount() {
        //history.pushState(null, null, document.URL)
        //验证roomId是否在内存中，如果有的话就加入，若没有就去sqlite中去找，如果找到了，房间信息中的uid与玩家uid一至就建房，如果不一致就报错（房主还未激活），如果sqlite也没找到就报房间号无效
        const self = this;
        //var r = getQueryString('roomId').match(reg);
        if (!getQueryString('roomId')) {
            return;
        }
        // var reg = /^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/;
        // if (!reg.test(getQueryString('roomId'))) {
        //     alert('对不起，房间号不合法!');
        //     return;
        // }
        document.title = this.ruleName + '[房间号' + getQueryString('roomId') + ']-掌派桌游';
        axios.post('/api/getRoom', {
            roomId: getQueryString('roomId'),
        }).then(({ data }) => {
            //state,//0：房间数据已经创建，1：房间已激活，2：房间已失效
            if (!data) {
                alert('对不起，房间号不存在~');
                history.back();
                return false;
            } else {
                const room = data;
                if (room.state === 2) {
                    alert('对不起，此房间已失效~');
                    history.back();
                    return false;
                } else {
                    self.gameInit(room);
                    //this.heartBeat({ roomId: room.roomId, uid: this.state.user.uid });
                    // self.gameInit({
                    //     roomId: '292f0a78-e304-48cc-9aea-4fd0a7341347',
                    //     jsonData: JSON.stringify({ countdown: 30, colorType: 3, mulriple: 1, gameTime: 4 })
                    // });
                }
            }
        });
        window.setTimeout(() => {
            this.setState({ notice: false })
        }, 40000);
        // window.setInterval(() => {
        //     this.rainEventEffect({ rainType: 'wind' });
        // }, 5000);
    }
    //胡牌特效
    winEventEffect(data) {
        this.setState({ effectShow: 'effectActive' });
        window.setTimeout(() => {
            $('.winEffect').addClass(this.allGamers['user_' + data.uid]);
        }, 1500);
        window.setTimeout(() => {
            this.setState({ effectShow: '' });
            $('.winEffect').removeClass(this.allGamers['user_' + data.uid]);
        }, 2500);
    }
    //下雨特效
    rainEventEffect({ rainType }) {
        const rainEffectType = rainType === 'rain' ? '.rainEffect' : '.rainEffect2';
        $(rainEffectType).removeClass('hide').addClass('effectActive');
        const raintimer = window.setInterval(function () {
            let s = document.createElement('s');
            s.style[rainType === 'rain' ? 'left' : 'top'] = (Math.random() * (rainType === 'rain' ? 70 : 20)) + 'rem';
            if (parseInt(Math.random() * 10) > 5) s.className = 's2';
            $(rainEffectType).append(s);
        }, rainType === 'rain' ? 10 : 400);
        window.setTimeout(function () {
            try {
                $(rainEffectType).removeClass('effectActive').addClass('hide');
                window.clearInterval(raintimer);
                $(rainEffectType + ' s').remove();
            } catch (e) {
                raintimer && window.clearInterval(raintimer);
            }
        }, 2500);
    }
    getlocation() {
        //console.log(this.isGetlocationn);
        this.isGetlocationn = true;
        axios.post('/setLoaction', {
            roomId: getQueryString('roomId'),
            uid: userInfo.userid,
            location: userInfo.location
        }).then(() => { });
        // if (!isDebug) {
        //     wx.getLocation({
        //         type: 'wgs84', // 默认为wgs84的gps坐标，如果要返回直接给openLocation用的火星坐标，可传入'gcj02'
        //         success: function (res) {
        //             var latitude = res.latitude; // 纬度，浮点数，范围为90 ~ -90
        //             var longitude = res.longitude; // 经度，浮点数，范围为180 ~ -180。
        //             var speed = res.speed; // 速度，以米/每秒计
        //             var accuracy = res.accuracy; // 位置精度
        //             userInfo.location = {
        //                 latitude, longitude
        //             }
        //             axios.post('/setLoaction', {
        //                 roomId: getQueryString('roomId'),
        //                 uid: userInfo.userid,
        //                 location: { latitude: latitude, longitude: longitude }
        //             }).then(() => { });
        //         }
        //     });
        // } else {
        //     axios.post('/setLoaction', {
        //         roomId: getQueryString('roomId'),
        //         uid: userInfo.userid,
        //         location: { latitude: 0, longitude: 0 }
        //     }).then(() => { });
        // }
    }
    gameInit(room) {
        const self = this;
        let once = true;
        const roomOption = JSON.parse(room.jsonData);
        //this.countdown = process.env.NODE_ENV === 'development' ? 9999 : roomOption.countdown;
        this.ruleName = roomOption.ruleName;
        ruleName = '，' + this.ruleName;
        //开发测试的时候这里可以对游戏做临时配置
        const __option = {
            gamerNumber: playerNumber,
            rule: roomOption.rule,
            colorType: roomOption.colorType,//表示两黄牌还是三黄牌
            mulriple: roomOption.mulriple,//倍数
            gameTime: roomOption.gameTime,
            countdown: roomOption.countdown
        }
        this.setState({
            option: __option
        })
        ws.emit('checkin', JSON.stringify({
            user: self.state.user,
            roomId: room.roomId,
            option: __option
        }));
        ws.on('connect', function () {
            self.setState({ isConnectting: false })
        });
        ws.on('message', function (msg) {
            const data = JSON.parse(msg);
            let log;
            switch (data.type) {
                case 'roomData':
                    self.setState({ room: data.content });
                    if (self.isFristLoad) {
                        self.isFristLoad = false;
                        self.setState({ showMsgPanel: data.content.state === 'wait' ? true : false, showHelpPanel: '0' });
                    }
                    if (!self.isGetLocation) {
                        self.getlocation();
                    }
                    break;
                case 'gameData':
                    self.isUpdateTime = true;
                    if (data.content) {
                        newRecore = true;
                        if (data.content.isOver) {
                            if (self.lastData.isOver === false) self.lastData = clone({ room: self.state.room, game: self.state.game, isOver: true });
                            self.setState({ game: data.content, showRecore: true });
                        } else {
                            self.lastData = clone({ room: self.state.room, game: self.state.game, isOver: false });//将room和game缓存下来，用于展示游戏记录（不然其他玩家退出，会刷掉数据）
                            self.setState({ game: data.content });
                        }
                    } else {
                        self.setState({ game: undefined });
                    }
                    if (data.content.event) {
                        playSound(data.content.event);
                    }
                    break;
                case 'notified':
                    log = self.state.roomLog;
                    log.push({ type: 'notified', content: data.content });
                    self.setState({ roomLog: log });
                    break;
                case 'chat':
                    log = self.state.roomLog;
                    log.push({ type: 'chat', name: data.content.name, content: data.content.content });
                    self.setState({ roomLog: log });
                    break;
                case 'event':
                    //事件
                    //console.log(data.content);
                    if (data.content.type === 'win') {
                        self.winEventEffect({ uid: data.content.uid });
                    } else if (data.content.type === 'rain') {
                        self.rainEventEffect({ uid: data.content.uid, rainType: data.content.rainType });
                    }
                    break;
                case 'errorInfo':
                    alert(data.content);
                    if (data.order === "jump") {
                        location.href = '/playing?uid=' + userInfo.uid;
                    }
                    //history.back();
                    break;
            }
            isDebug && console.log(data.content);
            ws.emit('ack', JSON.stringify({
                ackId: data.ackId,
                uid: self.state.user.uid,
                roomId: room.roomId
            }));
        });
        ws.on('disconnect', function () {
            //显示重连
            self.setState({
                isConnectting: true
            })
            ws.emit('reconnectting', JSON.stringify({
                user: self.state.user,
                roomId: room.roomId,
                option: __option
            }));
        });
        const timerforBegin = window.setInterval(() => {
            if (isBegin === true && scoketDone === true) {
                window.clearInterval(timerforBegin);
                this.setState({ isBegin: true });
            }
        }, 50);
    }
    gameInfoCloseHandle(order) {
        newRecore = false;
        if (this.state.room.state === 'end') {
            //关闭连接
            //ws.emit('disconnect');
        }
        this.setState({ showRecore: false });
        if (order === 'ready') {
            ws.emit('ready', JSON.stringify({
                user: this.state.user,
                roomId: this.state.room.roomId,
                state: 'ready'
            }));
            playSound('click');
        }
    }
    gameInfoOpenHandle() {
        newRecore = false;
        playSound('click');
        this.setState({ showRecore: true });
    }
    showHelpPanelCloseHandle() {
        this.setState({ showHelpPanel: false });
    }
    showHelpPanelOpenHandle() {
        playSound('click');
        this.setState({ showHelpPanel: true });
    }


    readyCallback() {
        // if (this.state.game) {
        //     let gameCopy = clone(this.state.game);
        //     gameCopy.gameState[`user_${this.state.user.uid}`].cards = [];
        //     this.setState({ game: gameCopy });
        // }
        this.setState({ game: null, showMsgPanel: false });
    }
    //玩家时间到，自动为其出牌（已弃用）
    showCardAuto() {
        //获取应该出牌的玩家
        const mine = this.state.game.gameState['user_' + this.state.user.uid];
        if (mine.catcher || mine.actionCode.length !== 0) {
            if (mine.colorLack === '') {
                //选花色
                ws.emit('chooseColor', JSON.stringify({
                    roomId: this.props.room.roomId,
                    uid: mine.uid,
                    color: ['b', 't', 'w'][getRedomNum(0, 2)]
                }));
            } else if (mine.actionCode.length !== 0) {
                //如果有胡，就胡，不然默认过
                ws.emit('action', JSON.stringify({
                    roomId: this.state.room.roomId,
                    uid: mine.uid,
                    actionType: mine.actionCode.indexOf('winning') !== -1 ? 'winning' : 'pass'
                }));
            } else {
                //先看有没有打缺
                const addConcatCard = concatCard(mine);
                const _isLack = addConcatCard.filter(card => card.color === mine.colorLack).length === 0 ? true : false;
                let redomCard;
                if (!_isLack) {
                    //若没打缺，就打缺了的牌
                    if (mine.fatchCard.color === mine.colorLack) {
                        //如果摸的牌是要缺的，直接打
                        redomCard = mine.fatchCard;
                    } else {
                        const lackCards = mine.cards.filter(card => card.color === mine.colorLack);
                        redomCard = lackCards[0];
                    }

                } else {
                    //随便抽一张牌（优先抽摸到的牌）
                    redomCard = mine.fatchCard ? mine.fatchCard : mine.cards[getRedomNum(0, mine.cards.length - 1)];
                }
                if (redomCard) {
                    ws.emit('showCard', JSON.stringify({
                        roomId: this.state.room.roomId,
                        uid: mine.uid,
                        cardKey: redomCard.key
                    }));
                }
            }
        }
    }
    componentDidUpdate() {
        this.isUpdateTime = false;
        // if(this.state.isBegin){
        //     $('body .MainTable').delegate('','click',function(){

        //     })
        // }
    }
    toasthander() {
        // const toast = React.createElement('div', {
        //     className: 'toast'
        // }, 'toast Content');
    }
    componentDidCatch(error, errorInfo) {
        // Catch errors in any components below and re-render with error message  
        this.setState({
            error: error,
            errorInfo: errorInfo
        })
        // You can also log error messages to an error reporting service here  
    }
    render() {
        if (this.state.errorInfo) {
            return (
                <div>
                    <h2>出现异常，请检查网络-<a href={`${location.href}`}>刷新</a></h2>
                    <details style={{ whiteSpace: 'pre-wrap' }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo.componentStack}
                    </details>
                </div>
            );
        }

        let me, leftGamer, topGamer, rightGamer;
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
            if (me) this.allGamers['user_' + me.uid] = 'bottom';
            if (leftGamer) this.allGamers['user_' + leftGamer.uid] = 'left';
            if (rightGamer) this.allGamers['user_' + rightGamer.uid] = 'right';
            if (topGamer) this.allGamers['user_' + topGamer.uid] = 'top';
        }
        //只要有一个人没选择就要禁用
        let isAllcolorLack = '';
        if (this.state.game) {
            for (let item in this.state.game.gameState) {
                if (!this.state.game.gameState[item].colorLack) {
                    isAllcolorLack = 'hideLackIcon';
                    break;
                }
            }
        }
        const meGameState = this.state.game && me ? this.state.game.gameState['user_' + me.uid] : null;
        const rightGameState = this.state.game && rightGamer ? this.state.game.gameState['user_' + rightGamer.uid] : null;
        const leftGameState = this.state.game && leftGamer ? this.state.game.gameState['user_' + leftGamer.uid] : null;
        const topGameState = this.state.game && topGamer ? this.state.game.gameState['user_' + topGamer.uid] : null;
        return !this.state.isBegin ? <ImgLoader /> : <div style={{ height: '100%', overflow: 'hidden' }}><QueueAnim delay={300} duration={800} animConfig={[
            { opacity: [1, 0], scale: [(1, 1), (0.8, 0.8)] }
        ]} style={{ height: '100%' }}><div key='main' className={`MainTable ${isAllcolorLack} ${this.state.effectShow}`}>
                <div className='ruleNameBar'>{this.ruleName},{this.state.option.colorType === 2 ? '两' : '三'}门牌,{this.state.option.mulriple}倍</div>
                {me && <Gamer_mine game={this.state.game} user={me} room={this.state.room} userState={meGameState} lastOutCardKey={this.state.game && this.state.game.lastShowCard ? this.state.game.lastShowCard.key : ''} readyCallback={this.readyCallback} />}
                {rightGamer && <Gamer_right game={this.state.game} user={rightGamer} room={this.state.room} userState={rightGameState} lastOutCardKey={this.state.game && this.state.game.lastShowCard ? this.state.game.lastShowCard.key : ''} />}
                {leftGamer && <Gamer_left game={this.state.game} user={leftGamer} room={this.state.room} userState={leftGameState} lastOutCardKey={this.state.game && this.state.game.lastShowCard ? this.state.game.lastShowCard.key : ''} />}
                {topGamer && <Gamer_top game={this.state.game} user={topGamer} room={this.state.room} userState={topGameState} lastOutCardKey={this.state.game && this.state.game.lastShowCard ? this.state.game.lastShowCard.key : ''} />}
                <div className='gameInfoBar'>
                    <div className='remain'>
                        {this.state.game && <span>剩余<b>{this.state.game.remainCardNumber}</b>张&nbsp;&nbsp;</span>}
                        {this.state.room && <span>第{this.state.room.allTime - this.state.room.gameTime}/{this.state.room.allTime}局</span>}
                    </div>
                    <div className='buttonWrap'><button className='record' onClick={this.gameInfoOpenHandle}></button>
                        <button className='msg' onClick={() => {
                            playSound('click');
                            this.setState({ showMsgPanel: !this.state.showMsgPanel });
                        }}></button>
                        <button className='music' onClick={() => {
                            bgPlay();
                            this.setState({
                                toast: bgMusicDisable ? '背景音乐关' : '背景音乐开'
                            });
                        }}></button>
                        <button className='sound' onClick={() => {
                            disableSound = !disableSound;
                            this.setState({
                                toast: disableSound ? '音效关' : '音效开'
                            });
                        }}></button>
                        <button className='help' onClick={this.showHelpPanelOpenHandle.bind(this)}></button>
                        <button className='exit' onClick={() => {
                            const exit = () => {
                                ws.emit('exit', JSON.stringify({ roomId: this.state.room.roomId, uid: me.uid }));
                                window.setTimeout(() => {
                                    //window.close();
                                    window.open("", "_self").close()
                                }, 1000);
                            }
                            if (this.state.room.state === 'playing') {
                                if (confirm('游戏还在运行中，您确定要退出游戏吗？')) {
                                    exit();
                                    wx.closeWindow();
                                }
                            } else {
                                exit();
                                wx.closeWindow();
                            }
                        }}></button>

                    </div>
                </div>
                {this.state.game && <div className='tableCenter'>
                    <Countdown
                        time={this.state.game.remainTime}
                        roomState={this.state.room.state}
                        isOver={this.state.game.isOver}
                        isUpdateTime={this.isUpdateTime}
                    //timeOverHander={this.showCardAuto} 
                    />
                    {meGameState && <div className={`${meGameState.catcher && 'bottom'}`}></div>}
                    {rightGameState && <div className={`${rightGameState.catcher && 'right'}`}></div>}
                    {leftGameState && <div className={`${leftGameState.catcher && 'left'}`}></div>}
                    {topGameState && <div className={`${topGameState.catcher && 'top'}`}></div>}
                </div>}
                <QueueAnim className='gameInfoWrapper' duration={300} animConfig={[
                    { opacity: [1, 0], scale: [(1, 1), (0.85, 0.85)] }
                ]}>
                    {this.state.showRecore && <GameInfo key='infoPanel' closeHandle={this.gameInfoCloseHandle} user={me} room={this.lastData.room || this.state.room} isOver={this.state.game && this.state.game.isOver} />}
                </QueueAnim>
                <QueueAnim className='gameInfoWrapper' duration={300} animConfig={[
                    { opacity: [1, 0], scale: [(1, 1), (0.85, 0.85)] }
                ]}>
                    {this.state.showHelpPanel && <GameHelpPabel key='helpPanel' closeHandle={this.showHelpPanelCloseHandle.bind(this)} rule={this.state.showHelpPanel === '0' ? 'law' : this.state.option.rule} />}
                </QueueAnim>

                {/* <QueueAnim>
                    {this.state.showRecore && <GameInfo key='infoPanel' closeHandle={this.gameInfoCloseHandle} user={me} room={this.lastData.room || this.state.room} isOver={this.state.game && this.state.game.isOver} />}
                </QueueAnim> */}
                <MsgPanel roomLog={this.state.roomLog} visible={this.state.showMsgPanel}
                    onClose={() => { this.setState({ showMsgPanel: false }) }}
                    sendMsg={(content) => {
                        ws.emit('chatMsg', JSON.stringify({
                            roomId: this.state.room.roomId,
                            name: this.state.user.name,
                            content: content
                        }));
                    }} />
            </div>
            {!this.state.keepVertical && <div className='orientationWeak'>
                <span>
                    为了更好的游戏体验，请打开手机的允许屏幕旋转开关，Android用户还需在微信中进行设置：我->设置->通用->开启横屏模式
                    <br /><br />
                    <a href='javascript:;' onClick={() => {
                        this.setState({ keepVertical: true })
                    }}>坚持竖屏</a>
                </span>
            </div>}
            {
                (this.state.isConnectting || this.isFristLoad) && <QueueAnim className='importantWeak'><span>{this.isFristLoad ? '正在连接中，请稍后...' : '网络重连中，请稍后...'}
                    <a href='javascript:;' onClick={() => {
                        location.reload();
                    }}>刷新</a></span>
                </QueueAnim>
            }
            <div className={`winEffect ${this.state.effectShow ? this.state.effectShow : 'hide'}`}>
                <span></span>
            </div>
            <div className='rainEffect hide'>
                <span></span>
            </div>
            <div className='rainEffect2 hide'>
                <span></span>
            </div>
        </QueueAnim>
            <Sound />
            <Toast key='toast' content={this.state.toast} onHide={() => { this.setState({ toast: '' }) }} />
            {this.state.notice && <div className='notice'><marquee >掌派桌游正式公测，无需房卡免费开房，欢迎玩家踊跃试玩，测试版本可能存在尚未发现的错误，若游戏期间出现问题望请理解，同时您也可以将问题截图发到我们的公众号，验证为有效bug将奖励50张房卡(公测期间每晚1:00~2:00点为固定系统维护期，可能会出现不稳定的情况，玩家请尽量绕开此时段游戏，感谢您的试玩！)</marquee></div>}
        </div>
    }
}
class Countdown extends Component {
    constructor(props) {
        super(props);
        this.state = {
            countdown: this.props.time
        }
        this.isEnd = false;
        this.timer = undefined;
        this.bagin = this.bagin.bind(this);
    }
    componentDidMount() {
        this.bagin();
    }
    componentWillUnmount() {
        window.clearInterval(this.timer);
    }
    bagin() {
        window.clearInterval(this.timer);
        this.timer = window.setInterval(() => {
            if (this.state.countdown === 0) {
                this.props.timeOverHander && this.props.timeOverHander();
                window.clearInterval(this.timer);
            } else {
                this.setState({ countdown: --this.state.countdown });
            }
        }, 1000);
    }
    componentWillReceiveProps(nextProps) {
        if (!newRecore) { return false; }
        if (!nextProps.isUpdateTime) return false;
        if (nextProps.isOver) {
            window.clearInterval(this.timer);
        } else {
            if (nextProps.roomState === 'playing') {
                this.setState({ countdown: nextProps.time }, () => {
                    this.bagin();
                    // window.clearInterval(this.timer);
                    // this.timer = window.setInterval(() => {
                    //     if (this.state.countdown === 0) {
                    //         this.props.timeOverHander && this.props.timeOverHander();
                    //         window.clearInterval(this.timer);
                    //     } else {
                    //         this.setState({ countdown: --this.state.countdown });
                    //     }
                    // }, 1000);
                });
            } else {
                this.setState({ countdown: nextProps.time });
                window.clearInterval(this.timer);
            }
        }
        //if (this.timer) { return; }
    }
    render() {
        return <div className={`center ${this.state.countdown <= 5 && 'warn'}`}>{this.state.countdown}</div>
    }
}
class GamerDock extends Component {
    constructor(props) {
        super(props);
        this.state = {
            active: false
        }
        this.myEvent = undefined;
        this.showWeakTimer;
        this.getTotal = this.getTotal.bind(this);
        this.checkHander = this.checkHander.bind(this);
        this.isKing = this.isKing.bind(this);
        this.lastGameData = {};
        this.timer;
    }
    static contextTypes = {
        game: PropTypes.object,
        room: PropTypes.object,
        needUpdate: PropTypes.bool
    };
    getTotal(uid) {
        let total = 0;
        this.props.room.recode.map(item => {
            const _uid = uid || this.props.uid;
            const u = item.find(user => _uid === user.uid);
            total += u.point
        });
        if (uid) return total;
        return (total > 0 ? '+' : '') + total;
    }
    isKing(uid) {
        let max = 0; let maxUid = 0;
        this.context.room.gamers.forEach(gamer => {
            let score = this.getTotal(gamer.uid);
            if (score > max) {
                maxUid = gamer.uid;
                max = score;
            }
        });
        return uid === maxUid ? true : false;
    }
    // shouldComponentUpdate() {
    //     console.log(this.context.room.dataIndex + '|' + this.lastRoomData.dataIndex);
    //     if (this.context.room.dataIndex !== this.lastRoomData.dataIndex) {
    //         return true;
    //     }
    //     return false;
    // }
    componentWillReceiveProps() {
        //console.log(this.context.game.dataIndex)

    }
    checkHander() {
        this.setState({ active: !this.state.active });
        window.clearTimeout(this.timer);
        this.timer = window.setTimeout(() => {
            this.setState({ active: false });
        }, 3000);
    }
    componentDidUpdate() {
        if (this.context.game && (this.lastGameData.dataIndex === this.context.game.dataIndex)) return false;
        if (this.myEvent && this.props.room.state !== 'wait') {
            const payLoad = JSON.parse(this.context.game.payload);
            const _className = 'show';// (payLoad.lose && payLoad.lose.uid !== this.props.userState.uid) ? 'loseShow' : 'show';
            $(this.refs.showCardWeak).removeClass(_className).addClass(_className);
            window.clearTimeout(this.showWeakTimer);
            this.showWeakTimer = window.setTimeout(() => {
                $(this.refs.showCardWeak).removeClass(_className);
            }, (this.myEvent.name === 'win' || this.myEvent.name === 'rain') ? 5000 : 3000);
        } else {
            $(this.refs.showCardWeak).removeClass('show');
        }
        this.lastGameData = this.context.game || {};
    }
    render() {
        this.myEvent = undefined;
        let test = '---';
        if (this.context.game && this.context.game.event) {
            const payLoad = JSON.parse(this.context.game.payload);
            test = payLoad.uid;// payLoad.uid.find(_uid => _uid === this.props.userState.uid) ? 'yes' : 'no';
            if (payLoad.uid.find(_uid => _uid === this.props.userState.uid)) {
                //不是lose输分的时候玩家自己不现实气泡
                if (this.props.userState.uid !== userInfo.userid) {
                    this.myEvent = {}
                    if (this.context.game.event === 'showCard') {
                        this.myEvent['card'] = payLoad.card;
                    } else {
                        this.myEvent['name'] = {
                            'meet': <img src={cardsImages.meet} />,
                            'fullMeet': <img src={cardsImages.fullMeet} />,
                            'win': <img src={cardsImages.win} />,
                            'selfwin': <img src={cardsImages.win} />
                        }[this.context.game.event]
                    }
                }
            }
            if (payLoad.lose && payLoad.lose.uid.find(_uid => _uid === this.props.userState.uid)) {
                //如果在扣分列表里面//扣分提示
                this.myEvent = {}
                this.myEvent['name'] = -payLoad.lose.score;
            }
        }
        return <div id={`user_${this.props.uid}`} className={`userDock ${this.props.class_name} ${this.state.active && 'active'} ${this.props.offLine && 'disconnect'} ${this.props.userState && this.props.userState.isWin ? 'winner' : ''}`}
            onClick={this.checkHander}>
            <img src={this.props.avatar} />
            {this.props.userState && this.isKing(this.props.userState.uid) && <div className='king'></div>}
            <div className='nameWrap'>{this.props.name}</div>
            {/* <div className='nameWrap'>{test}-|-{this.props.userState ? this.props.userState.uid : ''}</div> */}
            {/* <span className='colorLack'>{getColorName(this.props.colorLack || {})}</span> */}
            {!this.state.active && <div className='score'><span>&nbsp;{this.getTotal()}</span></div>}
            {this.state.active && <div className='location'><p>LA：{this.props.location ? this.props.location.latitude : '获取中'}</p><p>LO：{this.props.location ? this.props.location.longitude : '获取中'}</p></div>}
            {this.state.active && <div className='Allscore'>15200</div>}
            {this.props.state === 'ready' && this.props.room.state === 'wait' && <div className="ready_ok"></div>}
            {this.props.userState && this.props.userState.colorLack ? <span className='colorLack'><img src={`/images/games/majiang2/${this.props.userState.colorLack}.png`} /></span> : ''}
            {/* <div ref='showCardWeak' className={`showCardWeak ${this.myEvent && 'show'}`}>{this.myEvent && (this.myEvent.card ? <img src={`/images/games/majiang2/cards/${this.myEvent.card.color}${this.myEvent.card.number}.png`} /> : <span>{this.myEvent.name}</span>)}</div> */}
            {/* <div ref='showCardWeak' className={`showCardWeak`}>{this.myEvent && (this.myEvent.card ? <img src={`/images/games/majiang2/cards/${this.myEvent.card.color}${this.myEvent.card.number}.png`} /> : <span>{this.myEvent.name}</span>)}</div> */}
            <div ref='showCardWeak' className={`showCardWeak`}>{this.myEvent && (this.myEvent.card ? <img src={cardsImages[`${this.myEvent.card.color}${this.myEvent.card.number}`]} /> : <span>{this.myEvent.name}</span>)}</div>
            <div className='disconnectWrap'></div>

            {/* {+this.props.offLine} */}
        </div>
    }
}
class Gamer_mine extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeCard: {},
            buttonVisible: false,
            fmChooseCardKey: [], //用于多杠的情况
            hadOutCardKey: ''//用于马上打出去的牌
        }
        this.cardHandler = false;
        this.isLack = false;
        this.addConcatCard = [];
        this.ready = this.ready.bind(this);
        this.clickHandle = this.clickHandle.bind(this);
        this.showCard = this.showCard.bind(this);
        this.chooseColor = this.chooseColor.bind(this);

    }
    // shouldComponentUpdate(nextProps) {
    //     if ((this.props.game && nextProps.game && this.props.room && nextProps.room && this.props.game.dataIndex === nextProps.game.dataIndex) && (this.props.room && this.props.room.dataIndex === nextProps.room.dataIndex)) {
    //         return false;
    //     }
    //     return true;
    // }
    ready() {
        if (this.cardHandler) return;
        this.cardHandler = true;
        const self = this;
        this.props.readyCallback();
        window.setTimeout(() => {
            ws.emit('ready', JSON.stringify({
                user: self.props.user,
                roomId: this.props.room.roomId,
                state: 'ready'
            }));
        }, 50);
        playSound('click');
    }
    componentWillReceiveProps(nextProps) {
        this.cardHandler = false;
        this.setState({
            buttonVisible: false,//nextProps.userState.actionCode.length === 0 ? true : false,
            activeCard: nextProps.userState && nextProps.userState.fatchCard || (nextProps.game && nextProps.userState.catcher && nextProps.game.event === 'meet' ? nextProps.userState.cards[nextProps.userState.cards.length - 1] : {}),
            hadOutCardKey: ''
        });


        // let timer;
        // //------------------------------------------------------测试自动打牌，自动准备--------------------------------------------------
        // if (this.props.user.state === 'wait') {
        //     timer = window.setTimeout(() => {
        //         this.ready();
        //     }, 15000);
        // } else {
        //     window.clearTimeout(timer);
        // }
    }
    showCard(order) {
        if (this.cardHandler) return;
        this.cardHandler = true;
        this.setState({ buttonVisible: true });
        const _concatCard = concatCard(this.props.userState);
        const _isLack = _concatCard.filter(card => card.color === this.props.userState.colorLack).length === 0 ? true : false;
        const _showCard = _concatCard.find(card => card.key === this.state.activeCard.key);

        if (!this.props.userState.catcher || (this.props.userState.colorLack !== _showCard.color && !_isLack)) {
            this.setState({ activeCard: {}, buttonVisible: false });
            this.cardHandler = false;
            return false;
        }

        //必须在打缺了的情况下，或者打的缺花色的牌，才通过
        if (_showCard.color === this.props.userState.colorLack || this.isLack) {
            this.setState({ activeCard: {}, hadOutCardKey: this.state.activeCard.key });
            this.cardHandler = false;
            ws.emit('showCard', JSON.stringify({
                roomId: this.props.room.roomId,
                uid: this.props.user.uid,
                cardKey: this.state.activeCard.key,
                fromUser: true,
                isCancleAction: order === 'cancleAction' ? true : false
            }));
            //考虑到流畅性，打完前端马上去掉这个牌
            if (isIOS) {
                playSound('showCard');
            }
        }
    }
    actionHandler(type) {
        if (this.cardHandler) return;
        let doCardKey = undefined;
        if (type === 'fullMeet') {
            //let allCard = concatCard(this.props.userState);
            //只要手牌有需要暗杠的就直
            // const isMeetToFull = this.props.userState.fatchCard && this.props.userState.groupCards.meet.find(meets => meets[0].key === this.props.userState.fatchCard.key) ? true : false;
            // if (!isMeetToFull) {
            if (this.props.userState.catcher) {
                //碰升级杠的牌
                const _cacrdsAddfatchCard = this.props.userState.fatchCard ? this.props.userState.cards.concat(this.props.userState.fatchCard) : this.props.userState.cards;
                let meetToFulls = []
                this.props.userState.groupCards.meet.forEach(meets => {
                    const _c = _cacrdsAddfatchCard.find(c => c.color === meets[0].color && c.number === meets[0].number);
                    if (_c) meetToFulls.push(_c);
                });
                //手牌原手4张的
                let { resultType_1, resultType_2 } = getCardShowTime(this.props.userState.cards);
                if (resultType_2.four.length + meetToFulls.length >= 2) {
                    //需要选择杠哪张牌，置灰其他牌
                    let _fmChooseCardKey = resultType_2.four.map(item => {
                        return resultType_1[item].card.key;
                    });
                    if (meetToFulls.lengt !== 0) _fmChooseCardKey = _fmChooseCardKey.concat(meetToFulls.map(c => c.key));
                    this.setState({
                        fmChooseCardKey: _fmChooseCardKey
                    });
                    return;
                } else if (resultType_2.four.length + meetToFulls.length === 1) {
                    doCardKey = meetToFulls.length === 1 ? meetToFulls[0].key : resultType_1[resultType_2.four[0]].card.key;
                }
            }
        }
        //}
        //}
        this.cardHandler = true;
        //点击了就马上隐藏按钮，免得再多生事端
        this.setState({ buttonVisible: true, fmChooseCardKey: [] });
        ws.emit('action', JSON.stringify({
            roomId: this.props.room.roomId,
            uid: this.props.user.uid,
            actionType: type,
            doCardKey: doCardKey
        }));
        if (isIOS && (type === 'meet' || type === 'fullMeet')) {
            playSound(type);
        }
    }
    clickHandle(e, card) {
        // if (e.target.className.indexOf('gray') == -1) {
        //     if (this.state.activeCard === item.key) {
        //         this.showCard();
        //     } else {
        //         //this.setState({ activeCard: (this.state.activeCard === item.key ? '' : item.key) });
        //         this.setState({ activeCard: item.key });
        //     }
        // }
        if (this.state.fmChooseCardKey.length !== 0) {
            //如果fmChooseCardKey选择值则说明是选择牌进行杠，需要执行杠操作
            if (this.state.fmChooseCardKey.indexOf(card.key) === -1) {
                //选择其他的非杠牌，不响应
                return;
            }
            this.setState({ fmChooseCardKey: [] });
            ws.emit('action', JSON.stringify({
                roomId: this.props.room.roomId,
                uid: this.props.user.uid,
                actionType: 'fullMeet',
                doCardKey: card.key
            }));
            return;
        }
        if (!this.isLack && card.color !== this.props.userState.colorLack) {
            //this.setState({ activeCard: {} });
        } else {
            if (card.key === this.state.activeCard.key) {
                // //如果有操作选项在，则禁用双击打牌，不然有点麻烦
                // if (this.props.userState.actionCode.length !== 0) { return; }
                if (this.state.buttonVisible) return;//隐藏这个的时候不执行
                if (this.props.userState.actionCode.length !== 0) {

                    this.showCard('cancleAction');
                } else {
                    this.showCard();
                }
                if (this.props.userState.catcher) {
                    this.setState({ activeCard: card });
                }
            } else {
                this.setState({ activeCard: card });
            }
        }
        playSound('select');
    }
    chooseColor(color) {
        this.setState({ buttonVisible: true });
        ws.emit('chooseColor', JSON.stringify({
            roomId: this.props.room.roomId,
            uid: this.props.user.uid,
            color: color
        }));
    }
    render() {
        let minColor = '', min = 100;
        if (this.props.userState) {
            //this.addConcatCard = concatCard(this.props.userState);
            this.isLack = concatCard(this.props.userState).filter(card => card.color === this.props.userState.colorLack).length === 0 ? true : false;
            let minColorObj = { b: 0, t: 0, w: 0 };
            this.props.userState.cards.forEach(card => {
                minColorObj[card.color]++;
            });
            for (let i in minColorObj) {
                if (minColorObj[i] < min) {
                    minColor = i;
                    min = minColorObj[i];
                }
            }
        }
        const ready = <div key='ready' onClick={this.ready} className='btu ready'></div>
        const btu_showCard = <div key='showCard' onClick={this.showCard} className={`btu showCard ${this.state.activeCard.key && 'active'}`}></div>
        const btu_meet = <div key='meet' onClick={() => this.actionHandler('meet')} className='btu meet'></div>;//碰
        const btu_fullMeet = <div key='fullMeet' onClick={() => this.actionHandler('fullMeet')} className='btu fullmeet'></div>;//杠
        const btu_win = <div key='winning' onClick={() => this.actionHandler('winning')} className='btu win'></div>;//胡牌
        const btu_pass = <div key='pass' onClick={() => this.actionHandler('pass')} className='btu pass' ></div>;//过


        const lackColorChoose = <div key='ColorChoose'>
            <div key='b' className={`btu chooseColor chooseB ${minColor === 'b' && 'mark'}`} onClick={() => this.chooseColor('b')}></div>
            <div key='t' className={`btu chooseColor chooseT ${minColor === 't' && 'mark'}`} onClick={() => this.chooseColor('t')}></div>
            <div key='w' className={`btu chooseColor chooseW ${minColor === 'w' && 'mark'}`} onClick={() => this.chooseColor('w')}></div>
        </div>
        //this.props.userState && console.log(this.props.userState);
        return <div className='gamerWrap_mine'>
            <GamerDock class_name='' {...this.props.user} room={this.props.room} userState={this.props.userState} />
            {this.props.userState && <QueueAnim delay={0} duration={500} type={['top']} className='cardListWrap' leaveReverse>
                {/* <QueueAnim delay={300} duration={800} animConfig={[
            { opacity: [1, 0], scale: [(1,1), (0.8,0.8)] }
          ]} style={{height:'100%'}}> */}
                {this.props.userState.groupCards.winCard && <div key='win_card' className='group'>
                    <Card type='group' card={this.props.userState.groupCards.winCard} ></Card>
                </div>}
                {this.props.userState.groupCards.meet.map((group, index) => <div key={`meets_${index}`} className='group meet'>
                    {group.map(card =>
                        <Card key={`meet_${card.key}`} type='group' card={card}></Card>)
                    }
                </div>)}
                {this.props.userState.groupCards.fullMeet.map((group, index) => <div key={`fullmeets_${index}`} className='group fullmeet'>
                    {group.map(card =>
                        <Card key={`fullmeet_${card.key}`} type='group' card={card} ></Card>)
                    }
                </div>)}
                {this.props.userState.cards.filter(c => c.key !== this.state.hadOutCardKey).map(card =>
                    <div className='mainCards' style={{ display: 'inline-block' }} key={`cardWrap_${card.key}`}>
                        <Card
                            key={`card_mine_${card.key}`}
                            activeKey={this.state.activeCard.key}
                            clickHandle={this.clickHandle}
                            type={`mine_main ${(!this.isLack && this.props.userState.colorLack !== card.color) || (this.state.fmChooseCardKey.length > 1 && this.state.fmChooseCardKey.indexOf(card.key) === -1) ? 'gray' : ''}`}
                            card={card}>
                        </Card></div>)
                }

                {this.props.userState.fatchCard && <div key='fetchCard' className='fetchCard'>
                    <Card activeKey={this.state.activeCard.key} clickHandle={this.clickHandle}
                        type={`mine_main ${!this.isLack && (this.props.userState.colorLack !== this.props.userState.fatchCard.color || (this.state.fmChooseCardKey.length > 1 && this.state.fmChooseCardKey.indexOf(card.key) === -1)) ? 'gray' : ''} stress`}
                        card={this.props.userState.fatchCard}></Card>
                </div>}
                <div className='winDesc'>{this.props.userState.winDesc}</div>
                {/* <div className='winDesc'>{this.props.userState.winDesc && this.props.userState.winDesc.indexOf(':') ? this.props.userState.winDesc.split(':')[1] : this.props.userState.winDesc}</div> */}
            </QueueAnim>}
            {this.props.userState && <QueueAnim delay={200} duration={500} type={['bottom']} className='outCardListWrap'>
                {this.props.userState.outCards.map(card =>
                    <div style={{ display: 'inline-block' }} key={`out_${card.key}`}><Card type={`mine_main_out ${this.props.lastOutCardKey === card.key ? 'mark' : ''}`} card={card}></Card></div>)
                }
            </QueueAnim>}
            <QueueAnim className='operateWrap' duration={300} animConfig={[
                { opacity: [1, 0], scale: [(1, 1), (0.8, 0.8)] }
            ]}>
                {!this.state.buttonVisible ? <div key='opeat'>
                    {this.props.user.state === 'wait' && ready}
                    {this.props.userState && !this.props.userState.colorLack && lackColorChoose}
                    {this.props.user.state !== 'wait' && this.props.room.state !== 'wait' && this.props.userState && this.props.userState.catcher && this.props.userState.actionCode.length === 0 && (this.state.activeCard.key || this.props.game.event === 'meet') && btu_showCard}
                    {
                        //这里可能会不显示操作面板（如果是碰，但是又有玩家要胡牌）
                        this.props.userState && !this.props.game.isOver && this.props.userState.actionCode.map(action => {
                            if (action === 'meet' && !this.props.userState.isPause) return btu_meet;
                            if (action === 'fullMeet' && !this.props.userState.isPause) return btu_fullMeet;
                            if (action === 'winning') return btu_win;
                        })
                    }
                    {this.props.userState && this.props.user.state !== 'wait' && !this.props.userState.isPause && this.props.userState.actionCode.length !== 0 && btu_pass}
                </div> : ''}
                {<div className={`loadingPanel ${this.state.buttonVisible && 'action'}`}>loading</div>}
            </QueueAnim>
        </div>
    }
}
class Gamer_right extends Component {
    constructor(props) {
        super(props);
    }
    shouldComponentUpdate(nextProps) {
        if ((this.props.game && nextProps.game && this.props.room && nextProps.room && this.props.game.dataIndex === nextProps.game.dataIndex) && (this.props.room && this.props.room.dataIndex === nextProps.room.dataIndex)) {
            return false;
        }
        return true;
    }
    render() {
        return <div className='gamerWrap_right'>
            <GamerDock class_name='' {...this.props.user} room={this.props.room} userState={this.props.userState} />
            {this.props.userState && <div className='cardListWrap'>
                {this.props.userState.groupCards.winCard && <div key='win_card' className='group'>
                    <Card type='group' card={this.props.userState.groupCards.winCard} ></Card>
                </div>}
                {this.props.userState.groupCards.meet.map((group, index) => <div key={`meets_${index}`} className='group meet'>
                    {group.map(card =>
                        <Card key={`meet_${card.key}`} type='group' card={card}></Card>)
                    }
                </div>)}
                {this.props.userState.groupCards.fullMeet.map((group, index) => <div key={`fullmeets_${index}`} className='group fullmeet'>
                    {group.map(card =>
                        <Card key={`fullmeet_${card.key}`} type='group' card={card} ></Card>)
                    }
                </div>)}
                {(() => {
                    if (isRealNum(this.props.userState.cards)) {
                        let result = [];
                        for (let i = 0; i < +this.props.userState.cards; i++) {
                            result.push(<Card key={i} type='side_gamer_main'></Card>)
                        }
                        return result;
                    } else {
                        return this.props.userState.cards.map(card => <Card key={`card_${card.key}`} type='group' card={card} ></Card>)
                    }
                })()}

                {this.props.userState.fatchCard && <div className='fetchCard'>
                    <Card key='fetchCard' type='side_gamer_main stress'></Card>
                </div>}

            </div>}
            {this.props.userState && <QueueAnim delay={0} duration={500} type={['top']} className='outCardListWrap'>
                {this.props.userState.outCards.map(card =>
                    <div style={{ display: 'inline-block' }} key={`out_${card.key}`}><Card type={`mine_main_out ${this.props.lastOutCardKey === card.key ? 'mark' : ''}`} card={card}></Card></div>)
                }
            </QueueAnim>}
        </div>
    }
}
class Gamer_top extends Component {
    constructor(props) {
        super(props);
    }
    shouldComponentUpdate(nextProps) {
        if ((this.props.game && nextProps.game && this.props.room && nextProps.room && this.props.game.dataIndex === nextProps.game.dataIndex) && (this.props.room && this.props.room.dataIndex === nextProps.room.dataIndex)) {
            return false;
        }
        return true;
    }
    render() {
        return <div className='gamerWrap_top'>
            <GamerDock class_name='' {...this.props.user} room={this.props.room} userState={this.props.userState} />
            {this.props.userState && <div className='cardListWrap'>
                {this.props.userState.groupCards.meet.map((group, index) => <div key={`meets_${index}`} className='group meet'>
                    {group.map(card =>
                        <Card key={`meet_${card.key}`} type='group' card={card}></Card>)
                    }
                </div>)}
                {this.props.userState.groupCards.fullMeet.map((group, index) => <div key={`fullmeets_${index}`} className='group fullmeet'>
                    {group.map(card =>
                        <Card key={`fullmeet_${card.key}`} type='group' card={card} ></Card>)
                    }
                </div>)}
                {(() => {
                    if (isRealNum(this.props.userState.cards)) {
                        let result = [];
                        for (let i = 0; i < +this.props.userState.cards; i++) {
                            result.push(<Card key={i} type='face_gamer_main'></Card>)
                        }
                        return result;
                    } else {
                        return this.props.userState.cards.map(card => <Card key={`card_${card.key}`} type='group' card={card} ></Card>)
                    }
                })()}
                {this.props.userState.groupCards.winCard && <div key='win_card' className='group'>
                    <Card type='group' card={this.props.userState.groupCards.winCard} ></Card>
                </div>}
                {this.props.userState.fatchCard && <div className='fetchCard'>
                    <Card key='fetchCard' type='face_gamer_main stress'></Card>
                </div>}

            </div>}
            {this.props.userState && <QueueAnim delay={0} duration={500} type={['top']} className='outCardListWrap'>
                {this.props.userState.outCards.map(card =>
                    <div style={{ display: 'inline-block' }} key={`out_${card.key}`}><Card type={`mine_main_out ${this.props.lastOutCardKey === card.key ? 'mark' : ''}`} card={card}></Card></div>)
                }
            </QueueAnim>}
        </div>
    }
}
class Gamer_left extends Component {
    constructor(props) {
        super(props);
    }
    shouldComponentUpdate(nextProps) {
        if ((this.props.game && nextProps.game && this.props.room && nextProps.room && this.props.game.dataIndex === nextProps.game.dataIndex) && (this.props.room && this.props.room.dataIndex === nextProps.room.dataIndex)) {
            return false;
        }
        return true;
    }
    render() {
        return <div className='gamerWrap_left'>
            <GamerDock class_name='' {...this.props.user} room={this.props.room} userState={this.props.userState} />
            {this.props.userState && <div className='cardListWrap'>
                {this.props.userState.groupCards.winCard && <div key='win_card' className='group'>
                    <Card type='group' card={this.props.userState.groupCards.winCard} ></Card>
                </div>}
                {this.props.userState.groupCards.meet.map((group, index) => <div key={`meets_${index}`} className='group meet'>
                    {group.map(card =>
                        <Card key={`meet_${card.key}`} type='group' card={card}></Card>)
                    }
                </div>)}
                {this.props.userState.groupCards.fullMeet.map((group, index) => <div key={`fullmeets_${index}`} className='group fullmeet'>
                    {group.map(card =>
                        <Card key={`fullmeet_${card.key}`} type='group' card={card} ></Card>)
                    }
                </div>)}
                {(() => {
                    if (isRealNum(this.props.userState.cards)) {
                        let result = [];
                        for (let i = 0; i < +this.props.userState.cards; i++) {
                            result.push(<Card key={i} type='side_gamer_main'></Card>)
                        }
                        return result;
                    } else {
                        return this.props.userState.cards.map(card => <Card key={`card_${card.key}`} type='group' card={card} ></Card>)
                    }
                })()}

                {this.props.userState.fatchCard && <div className='fetchCard'>
                    <Card key='fetchCard' type='side_gamer_main stress'></Card>
                </div>}

            </div>}
            {this.props.userState && <QueueAnim delay={0} duration={500} type={['top']} className='outCardListWrap'>
                {this.props.userState.outCards.map(card =>
                    <div style={{ display: 'inline-block' }} key={`out_${card.key}`}><Card type={`mine_main_out ${this.props.lastOutCardKey === card.key ? 'mark' : ''}`} card={card}></Card></div>)
                }
            </QueueAnim>}
        </div>
    }
}
class Card extends Component {
    constructor(props) {
        super(props);
        this.state = { activeCard: {} }
        this.cardClick = this.cardClick.bind(this);
    }
    cardClick(e, card) {
        this.props.clickHandle && this.props.clickHandle(e, card);
    }
    shouldComponentUpdate(nextProps) {
        if (nextProps.card && this.props.card && !nextProps.activeKey && nextProps.type === this.props.type && nextProps.card.key === this.props.card.key) {
            //console.log(nextProps.card);
            return false;
        }
        return true;
    }
    render() {
        let card = <span onClick={(e) => { this.cardClick(e, this.props.card) }} className={`card card_${this.props.type} ${this.props.card && this.props.card.key === this.props.activeKey && 'active'}`}>
            {/* {this.props.card && <img src={`/images/games/majiang2/cards/${this.props.card.color}${this.props.card.number}.png`} />} */}
            {this.props.card && <img src={cardsImages[`${this.props.card.color}${this.props.card.number}`]} />}
        </span>;
        // if (this.props.type === 'mine_main') {
        //     card = <span onClick={() => { this.cardClick(this.props.card) }} className={`card card_mine_main ${this.props.card === activeCard.key && 'active'}`}>
        //         <img src='/images/games/majiang2/cards/t7.png' /></span>
        // } else if (this.props.type === 'mine_group') {
        //     card = <span onClick={() => { this.cardClick(this.props.card) }} className='card card_mine_group'>
        //         <img src='/images/games/majiang2/cards/b7.png' /></span>
        // } else if (this.props.type === 'mine_fetch') {
        //     card = <span onClick={() => { this.cardClick(this.props.card) }} className='card card_mine_fetch'>
        //         <img src='/images/games/majiang2/cards/b7.png' /></span>
        // }
        return card;
    }
}
class GameInfo extends Component {
    constructor(props) {
        super(props);
        this.isKing = this.isKing.bind(this);
    }
    // shouldComponentUpdate(nextProps, nextState) {
    //     if (this.props.game.isOver) {
    //         //如果是结束的时候，则不更新
    //         return false;
    //     } else {
    //         return true
    //     }
    // }
    static contextTypes = {
        room: PropTypes.object
    };
    getTotal(uid, isNumber) {
        let total = 0;
        this.props.room.recode.map(item => total += item.find(user => uid === user.uid).point);
        if (isNumber) return total;
        return (total > 0 ? '+' : '') + total;
    }
    isKing(uid) {
        let max = 0; let maxUid = 0;
        this.context.room.gamers.forEach(gamer => {
            let score = this.getTotal(gamer.uid, true);
            if (score > max) {
                maxUid = gamer.uid;
                max = score;
            }
        });
        return uid === maxUid ? true : false;
    }
    render() {

        let recode = clone(this.props.room.recode);
        recode = recode.reverse();
        return <div className='mask'>
            <div className='gameInfoPanel'>
                {this.props.isOver && <header></header>}
                <div className='contentWrap'>
                    {
                        this.props.room.gamers.map((gamer, index) => <div key={index} className='content'>
                            <div className={gamer.uid === this.props.user.uid ? `self` : ''}>
                                <header>
                                    <div>
                                        <img src={`${gamer.avatar}`} />
                                        {this.isKing(gamer.uid) && <div className='king'></div>}
                                    </div>
                                    <span>{gamer.name}</span>

                                </header>
                                <ul className='list'>
                                    {
                                        recode.map((item, _index) =>
                                            <li key={`li_${_index}`}>
                                                第{recode.length - _index}局： {item.find(user => user.uid === gamer.uid).point < 0 ? '' : '+'}
                                                {item.find(user => user.uid === gamer.uid).point}
                                                <div><label>{item.find(user => user.uid === gamer.uid).winDesc || '---'}</label></div>
                                            </li>)
                                    }
                                </ul>
                                <footer>
                                    总成绩：<span>{this.getTotal(gamer.uid)}</span>
                                </footer>
                            </div>
                        </div>)
                    }
                </div>
                <footer>
                    {this.props.room.state === 'end' && <div className='overWeak'>{this.props.room.allTime}局游戏已全部结束，休息一下，等你再战！</div>}
                    <button className='closeBtu' style={{ marginBottom: 0 }} onClick={this.props.closeHandle}></button>
                    {this.props.room.state !== 'end' && this.props.isOver && <button className='closeBtu ready' style={{ marginBottom: 0, marginLeft: 10 }} onClick={() => { this.props.closeHandle('ready') }}></button>}
                </footer>
            </div>

        </div>
    }
}
class GameHelpPabel extends Component {
    constructor(props) {
        super(props);
        this.state = {
            chooseRule: this.props.rule
        }
        this.ruleGroup = [
            {
                key: 'law',
                name: '法律声明',
                content: <div>
                    法律声明详细
                </div>
            },
            {
                key: 'chengdu',
                name: '成都麻将',
                content: <div>成都麻将详细规则</div>
            },
            {
                key: 'guangan',
                name: '广安麻将',
                content: <div>广安麻将详细规则</div>
            }
        ]
    }
    // componentWillReceiveProps(nextProps) {
    //     this.setState({
    //         chooseRule: nextProps.rule
    //     });
    // }
    render() {
        return <div className='mask'>
            <div className='gameInfoPanel'>
                <div className='helpContentWrap'>
                    <hgroup>
                        {this.ruleGroup.map(item => <h2 key={item.key} className={`${this.state.chooseRule === item.key && 'active'}`}
                            onClick={() => {
                                this.setState({
                                    chooseRule: item.key
                                });
                            }}> {item.name}</h2>)}
                    </hgroup>
                    <div className='helpContent'>
                        {this.ruleGroup.find(item => item.key === this.state.chooseRule).content}
                    </div>
                </div>
                <footer>
                    {this.state.chooseRule === 'law' ?
                        <button className='closeBtu accept' style={{ marginBottom: 0 }} onClick={this.props.closeHandle}></button> :
                        <button className='closeBtu' style={{ marginBottom: 0 }} onClick={this.props.closeHandle}></button>}

                </footer>
            </div>
        </div>
    }
}
class Toast extends Component {
    constructor(props) {
        super(props);
        this.state = {
            content: this.props.content,
        }
        this.timer = undefined;
    }
    shouldComponentUpdate(nextProps) {
        return nextProps.content !== this.state.content
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.content !== this.state.content) {
            if (this.timer) window.clearTimeout(this.timer);
            this.setState({
                content: nextProps.content,
            });
            this.timer = window.setTimeout(() => {
                this.props.onHide();
            }, 2000);
        }
    }
    render() {
        return <div key='toast' className={`toast ${this.state.content && 'show'}`}>{this.state.content}</div>
    }
}
class MsgPanel extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            emojiVisible: false,
            msgContent: '',
            miniMsgPanel: false,
            miniMsgPanelList: [],
            roomLog: this.props.roomLog//.reverse()
        }
        this.timer;
        this.logCount = this.props.roomLog.length;
        this.scrollHeight = 0;
        this.send = this.send.bind(this);
    }
    getTotal(uid) {
        let total = 0;
        this.props.room.recode.map(item => total += item.find(user => uid === user.uid).point);
        return (total > 0 ? '+' : '') + total;
    }
    // shouldComponentUpdate(nextProps) {
    //     return this.props.roomLog.length === nextProps.roomLog.length ? false : true;
    // }
    componentWillReceiveProps(nextProps) {
        const _l = nextProps.roomLog.length - this.logCount;
        if (_l > 0 && !this.props.visible) {
            const _miniMsgPanelList = clone(nextProps.roomLog).splice(nextProps.roomLog.length - _l, _l);
            this.setState({ miniMsgPanel: true, miniMsgPanelList: _miniMsgPanelList });
            window.clearTimeout(this.timer);
            this.timer = window.setTimeout(() => {
                this.setState({ miniMsgPanel: false });
            }, 3000);
        }
        this.setState({
            roomLog: nextProps.roomLog//.reverse()
        })
        this.logCount = nextProps.roomLog.length;
        $('.mainList').scrollTop($('.mainList').height());
    }
    componentDidUpdate() {
        $('.mainList').scrollTop($('.mainList').height());
    }
    componentDidMount() {
        const self = this;
        $('#selection,#selectionEmoji').delegate('li', 'click', function () {
            self.props.sendMsg(this.innerText);
            self.setState({ visible: false, emojiVisible: false });
        })
    }
    send() {
        if (this.state.msgContent.trim() === '') return;
        this.props.sendMsg(this.state.msgContent);
        this.setState({ msgContent: '' });
    }
    render() {
        return <div className={`msgPanel ${this.props.visible ? '' : 'hide'}`}>
            <header>
                <input placeholder='在此输入，回车/换行发送消息' value={this.state.msgContent} type='text' maxLength='30' onChange={(e) => {
                    this.setState({ msgContent: e.target.value });
                }} onKeyUp={(e) => {
                    if (e.keyCode === 13) {
                        this.send();
                    }
                }} />
                <button onClick={this.send}>
                    <svg t="1528129063145" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="994" width="25" height="25" style={{ width: '2rem', height: '2rem' }}><defs><style type="text/css"></style></defs><path d="M511.63136 1023.16032c-282.05056 0-511.52896-229.45792-511.52896-511.52896S229.5808 0.1024 511.63136 0.1024 1023.16032 229.5808 1023.16032 511.63136 793.7024 1023.16032 511.63136 1023.16032zM511.63136 61.93152c-247.97184 0-449.69984 201.728-449.69984 449.69984s201.728 449.69984 449.69984 449.69984S961.3312 759.6032 961.3312 511.63136 759.6032 61.93152 511.63136 61.93152z" p-id="995" fill="#ffffff"></path><path d="M428.544 706.10944c-8.15104 0-15.95392-3.23584-21.72928-8.99072l-153.8048-153.8048c-12.00128-12.00128-12.00128-31.45728 0-43.45856 12.00128-12.00128 31.4368-12.00128 43.43808 0l132.096 132.096 279.01952-279.04c12.00128-12.00128 31.4368-12.00128 43.43808 0 12.00128 11.9808 12.00128 31.4368 0 43.43808L450.2528 697.09824C444.49792 702.85312 436.69504 706.10944 428.544 706.10944z" p-id="996" fill="#ffffff"></path></svg>
                </button>
                <button onClick={() => { this.setState({ visible: !this.state.visible }) }}>
                    <svg t="1528108975819" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1886" width="25" height="25" style={{ width: '2rem', height: '2rem' }}><defs><style type="text/css"></style></defs><path d="M512 1024a512 512 0 1 1 512-512 512.531692 512.531692 0 0 1-512 512z m0-967.089231A455.089231 455.089231 0 1 0 967.108923 512 455.660308 455.660308 0 0 0 512 56.910769z m211.042462 506.683077A51.593846 51.593846 0 1 1 774.734769 512a51.613538 51.613538 0 0 1-51.692307 51.593846zM512 563.593846A51.593846 51.593846 0 1 1 563.692308 512 51.593846 51.593846 0 0 1 512 563.593846z m-211.042462 0A51.593846 51.593846 0 1 1 352.649846 512a51.593846 51.593846 0 0 1-51.692308 51.593846z" p-id="1887" fill="#ffffff"></path></svg>
                </button>
                <button onClick={() => { this.setState({ emojiVisible: !this.state.emojiVisible }) }}>
                    <svg t="1530981370875" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2389" width="25" height="25" style={{ width: '2rem', height: '2rem' }}><defs><style type="text/css"></style></defs><path d="M512.512 1024C230.473143 1024 1.060571 794.331429 1.060571 512S230.509714 0 512.512 0c281.965714 0 511.414857 229.668571 511.414857 512s-229.412571 512-511.414857 512z m0-950.857143C270.774857 73.142857 74.130286 270.006857 74.130286 512s196.644571 438.857143 438.381714 438.857143S950.857143 753.993143 950.857143 512 754.212571 73.142857 512.512 73.142857z" fill="#ffffff" p-id="2390"></path><path d="M513.718857 810.678857a326.802286 326.802286 0 0 1-259.035428-126.427428 36.571429 36.571429 0 0 1 57.526857-45.056 254.208 254.208 0 0 0 201.508571 98.340571c80.018286 0 153.965714-36.461714 202.825143-100.059429a36.571429 36.571429 0 0 1 57.929143 44.544 326.509714 326.509714 0 0 1-260.754286 128.658286zM349.330286 515.657143a54.784 54.784 0 0 1-54.784-54.857143v-73.142857a54.784 54.784 0 1 1 109.568 0v73.142857a54.857143 54.857143 0 0 1-54.784 54.857143zM678.107429 515.657143a54.857143 54.857143 0 0 1-54.820572-54.857143v-73.142857a54.857143 54.857143 0 1 1 109.604572 0v73.142857a54.857143 54.857143 0 0 1-54.784 54.857143z" fill="#ffffff" p-id="2391"></path></svg>
                </button>
                <div className={`${this.state.visible ? '' : 'hide'}`}>
                    <ul id='selection'>
                        <li>快点儿吧，等到我花都结果啦！😠</li>
                        <li>高手舅服你，给留点钱坐公交呗！😰</li>
                        <li>可惜我一手好牌，没让你们见到大场面~😌</li>
                        <li>真替你们庆幸这么年轻就认识了我！😎</li>
                        <li>身上就剩这条爱马仕的内裤了，收不？😭</li>
                        <li>麻神驾到，还不尖叫！！😱</li>
                        <li>输遍天下无敌手的我居然赢了你！😅</li>
                        <li>搏一搏，单车变摩托！🤑</li>
                        <li>乖乖，麻将国粹无处不在！</li>
                        <li>麻匪们，再来两局！</li>
                    </ul>
                </div>
                <div className={`${this.state.emojiVisible ? '' : 'hide'}`}>
                    <ul id='selectionEmoji'>
                        <li>😂</li><li>😬</li><li>😅</li><li>😊</li><li>😎</li><li>😫</li><li>😜</li><li>😓</li><li>🤑</li><li>😤</li>
                        <li>😭</li><li>😰</li><li>😱</li><li>😡</li><li>😴</li><li>😍</li><li>😚</li><li>🤔</li><li>🤗</li><li>🙄</li>
                        <li>😪</li><li>😵</li><li>🤓</li><li>🤐</li><li>👻</li><li>💩</li><li>🐥</li><li>💰</li><li>💣</li><li>🏆</li>
                        <li>✌</li><li>👍</li><li>👎🏼</li><li>👏</li><li>👌</li><li>🐷</li>
                    </ul>
                </div>
            </header>
            <div className='mainList'>
                <ul>
                    {this.state.roomLog.map((log, index) => log.type === 'notified' ?
                        <li className='sysMsg' key={`msg_${index}`}>
                            <svg t="1528109426023" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4483" width="20" height="15"><defs><style type="text/css"></style></defs><path d="M490.453333 87.68c-5.333333 0-10.88 2.026667-15.253333 6.613333L256 320 64 320l0 205.333333L64 704l192 0 218.773333 248.853333c4.373333 5.013333 10.133333 7.146667 15.786667 7.146667 10.986667 0 21.546667-8.426667 21.546667-21.333333L512.106667 525.333333 512.106667 109.013333C512 96.213333 501.44 87.68 490.453333 87.68zM448 525.333333l0 300.16L304.106667 661.76 284.906667 640 256 640 128 640 128 525.333333 128 384l128 0 27.093333 0 18.88-19.413333 146.133333-150.4L448.106667 525.333333z" p-id="4484" fill="#ffffff"></path><path d="M832 512c0-105.92-86.08-192-192-192l0 64c70.613333 0 128 57.386667 128 128s-57.386667 128-128 128l0 64C745.92 704 832 617.92 832 512z" p-id="4485" fill="#ffffff"></path><path d="M866.24 285.76C805.866667 225.28 725.44 192 640 192l0 64c68.373333 0 132.693333 26.666667 181.013333 74.986667C869.333333 379.306667 896 443.626667 896 512s-26.666667 132.693333-74.986667 181.013333C772.693333 741.333333 708.373333 768 640 768l0 64c85.44 0 165.866667-33.28 226.24-93.76 60.48-60.48 93.76-140.8 93.76-226.24S926.72 346.133333 866.24 285.76z" p-id="4486" fill="#ffffff"></path></svg>
                            <span>{log.content}</span></li> :
                        <li key={`msg_${index}`}><b>{log.name}</b>：{log.content}</li>)}
                    {/* <li className='sysMsg'>
                        <svg t="1528109426023" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4483" width="20" height="15"><defs><style type="text/css"></style></defs><path d="M490.453333 87.68c-5.333333 0-10.88 2.026667-15.253333 6.613333L256 320 64 320l0 205.333333L64 704l192 0 218.773333 248.853333c4.373333 5.013333 10.133333 7.146667 15.786667 7.146667 10.986667 0 21.546667-8.426667 21.546667-21.333333L512.106667 525.333333 512.106667 109.013333C512 96.213333 501.44 87.68 490.453333 87.68zM448 525.333333l0 300.16L304.106667 661.76 284.906667 640 256 640 128 640 128 525.333333 128 384l128 0 27.093333 0 18.88-19.413333 146.133333-150.4L448.106667 525.333333z" p-id="4484" fill="#ffffff"></path><path d="M832 512c0-105.92-86.08-192-192-192l0 64c70.613333 0 128 57.386667 128 128s-57.386667 128-128 128l0 64C745.92 704 832 617.92 832 512z" p-id="4485" fill="#ffffff"></path><path d="M866.24 285.76C805.866667 225.28 725.44 192 640 192l0 64c68.373333 0 132.693333 26.666667 181.013333 74.986667C869.333333 379.306667 896 443.626667 896 512s-26.666667 132.693333-74.986667 181.013333C772.693333 741.333333 708.373333 768 640 768l0 64c85.44 0 165.866667-33.28 226.24-93.76 60.48-60.48 93.76-140.8 93.76-226.24S926.72 346.133333 866.24 285.76z" p-id="4486" fill="#ffffff"></path></svg>
                        <span>系统消息~系统消息~</span></li>
                    <li><b>huangwei</b>：尼妹的，你能不能快点儿</li>
                    <li><b>huangwei</b>：你到底出不出啊？等到我胡子都白啦！！</li>
                    <li><b>huaei</b>：你到底出不出啊？等到我胡子都白啦！！</li>
                    <li><b>huangweibalabala</b>：尼妹的，你能不能快点儿</li> */}
                </ul>
            </div>
            <footer onClick={this.props.onClose}>
                <svg t="1528101175036" viewBox="0 0 1024 1024"
                    version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1884"
                    width="30" height="30" style={{ width: '2.2rem', height: '2.2rem' }}><defs><style type="text/css"></style></defs>
                    <path d="M702.3816269859672 511.8825858058409l-33.10658589284864-33.1274284925312-0.14173022098839289 0.1403411217033862L354.7249589068816 164.46143998578168l-33.10658589284869 33.10658589284864 314.4118260713292 314.43197412136965L321.6183730140326 826.4347529988735l33.10658589284865 33.10311178676787 314.40835196524887-314.43127889279253 0.1417302209883927 0.1403411217033864 33.106585892848685-33.13090259861198-0.11741419415920966-0.11671896558254967L702.3816269859672 511.8825858058409zM702.3816269859672 511.8825858058409" fill="#ffffff" p-id="1885">
                    </path>
                </svg>
            </footer>
            <div className={`miniMsgPanel ${this.state.miniMsgPanel && 'show'}`}>
                <ul>
                    {this.state.miniMsgPanelList.map((log, index) => log.type === 'notified' ?
                        <li className='sysMsg' key={`msg_${index}`}>
                            <svg t="1528109426023" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4483" width="20" height="15"><defs><style type="text/css"></style></defs><path d="M490.453333 87.68c-5.333333 0-10.88 2.026667-15.253333 6.613333L256 320 64 320l0 205.333333L64 704l192 0 218.773333 248.853333c4.373333 5.013333 10.133333 7.146667 15.786667 7.146667 10.986667 0 21.546667-8.426667 21.546667-21.333333L512.106667 525.333333 512.106667 109.013333C512 96.213333 501.44 87.68 490.453333 87.68zM448 525.333333l0 300.16L304.106667 661.76 284.906667 640 256 640 128 640 128 525.333333 128 384l128 0 27.093333 0 18.88-19.413333 146.133333-150.4L448.106667 525.333333z" p-id="4484" fill="#ffffff"></path><path d="M832 512c0-105.92-86.08-192-192-192l0 64c70.613333 0 128 57.386667 128 128s-57.386667 128-128 128l0 64C745.92 704 832 617.92 832 512z" p-id="4485" fill="#ffffff"></path><path d="M866.24 285.76C805.866667 225.28 725.44 192 640 192l0 64c68.373333 0 132.693333 26.666667 181.013333 74.986667C869.333333 379.306667 896 443.626667 896 512s-26.666667 132.693333-74.986667 181.013333C772.693333 741.333333 708.373333 768 640 768l0 64c85.44 0 165.866667-33.28 226.24-93.76 60.48-60.48 93.76-140.8 93.76-226.24S926.72 346.133333 866.24 285.76z" p-id="4486" fill="#ffffff"></path></svg>
                            <span>{log.content}</span></li> :
                        <li key={`msg_${index}`}><b>{log.name}</b>：{log.content}</li>)}
                </ul>
            </div>
        </div >
    }
}
class ImgLoader extends Component {
    constructor(props) {
        super(props);
        this.state = { percent: 0 };
        this.loadedCount = 0;
        //const host = 'https://yefeng-test.oss-cn-beijing.aliyuncs.com/images/';
        const host = '/images/games/majiang2/';
        this.imgList = [
            { key: "desktop1", url: host + "/desktop/desktop7.jpg" },
            { key: "center", url: host + "/center.png" },
            { key: "center_bottom", url: host + "/center_bottom.png" },
            { key: "center_left", url: host + "/center_left.png" },
            { key: "center_right", url: host + "/center_right.png" },
            { key: "center_top", url: host + "/center_top.png" },
            { key: "chooseB", url: host + "/chooseB.png" },
            { key: "chooseT", url: host + "/chooseT.png" },
            { key: "chooseW", url: host + "/chooseW.png" },
            { key: "endTitle", url: host + "/endTitle.png" },
            { key: "faceCard", url: host + "/faceCard.png" },
            { key: "fullmeet", url: host + "/fullmeet.png" },
            { key: "mainCard", url: host + "/mainCard.png" },
            { key: "mainCard_group", url: host + "/mainCard_group.png" },
            { key: "meet", url: host + "/meet.png" },
            { key: "pass", url: host + "/pass.png" },
            { key: "ready", url: host + "/ready.png" },
            { key: "showCard", url: host + "/showCard.png" },
            { key: "sideCard", url: host + "/sideCard.png" },
            { key: "sideCard2", url: host + "/sideCard2.png" },
            { key: "t", url: host + "/t.png" },
            { key: "w", url: host + "/w.png" },
            { key: "b", url: host + "/b.png" },
            { key: "win", url: host + "/win.png" },
            { key: "winner", url: host + "/winner.png" },
            { key: "remain", url: host + "/remain.png" },
            { key: "record", url: host + "/record.png" },
            { key: "close_btu", url: host + "/close_btu.png" },
            { key: "msg", url: host + "/msg.png" },
            { key: "msgBtu", url: host + "/msgBtu.png" },
            { key: "music", url: host + "/music.png" },
            { key: "sound", url: host + "/sound.png" },
            { key: "msgs", url: host + "/msgs.png" },
            { key: "exit", url: host + "/exit.png" },
            { key: "help", url: host + "/help.png" },
            { key: "accept", url: host + "/accept.png" },
            { key: "ready2", url: host + "/ready2.png" },
            { key: "crown", url: host + "/crown.png" },
            { key: "wind", url: host + "/bigEvent/wind.png" },
            { key: "tree", url: host + "/bigEvent/tree.png" },
            { key: "disconnect", url: host + "/disconnect.png" },
            { key: "bug_hu", url: host + "/bigEvent/bug_hu.png" },
            { key: "cloud", url: host + "/bigEvent/cloud.png" },
            { key: "house", url: host + "/bigEvent/house.png" },

        ];
        const cardColor = ['b', 't', 'w']; let cardArr = [];
        for (let i = 1; i <= 9; i++) {
            cardArr = cardArr.concat(cardColor.map(color => {
                return { key: color + i, url: host + "/cards/" + (color + i) + ".png" };
            }));
        }
        //this.imgList = this.imgList.concat(cardArr);
    }
    componentDidMount() {
        this.imgList.forEach(item => {
            loadImage(item.url).then((img) => {
                this.loadedCount++;
                //console.log(((loadedCount / imgList.length) * 100) + "%");
                //console.log(this.loadedCount + '---' + this.imgList.length);
                if (this.loadedCount === this.imgList.length) {
                    window.setTimeout(function () {
                        isBegin = true;
                    }, 1000);
                }
                this.setState({
                    percent: ((this.loadedCount / this.imgList.length) * 100)
                })
            });
        });
    }
    render() {
        // const result = (this.loadedCount === this.imgList.length ? <Table /> : <div className='loadWrap'>
        //     <div><span style={{ width: `${this.state.percent}%` }}>{parseInt(this.state.percent)}%</span>
        //         <h3>游戏资源加载中，请稍候...</h3>
        //     </div>
        // </div>);
        return <div className='loadWrap'>
            <div><span style={{ width: `${this.state.percent}%` }}>{parseInt(this.state.percent)}%</span>
                <h3>资源加载中，请稍候...</h3>
            </div>
        </div>;
    }
}
class Sound extends Component {
    constructor(props) {
        super(props);
        this.isLoad = false;
    }
    shouldComponentUpdate() {
        return false;
    }
    componentDidUpdate() {
        this.isLoad = false;
    }
    componentDidMount() {
        this.isLoad = true;
    }
    render() {
        //console.log('load');
        return <div>
            <audio controls="controls" src="sound/give.mp3" id="showCard" preload="auto" style={{ display: 'none' }}></audio>
            <audio controls="controls" src="sound/meet.mp3" id="meet" preload="auto" style={{ display: 'none' }}></audio>
            <audio controls="controls" src="sound/fullMeet.mp3" id="fullMeet" preload="auto" style={{ display: 'none' }}></audio>
            <audio controls="controls" src="sound/win.mp3" id="win" preload="auto" style={{ display: 'none' }}></audio>
            <audio controls="controls" src="sound/click.mp3" id="click" preload="auto" style={{ display: 'none' }}></audio>
            <audio controls="controls" src="sound/gameStart.mp3" id="gameStart" preload="auto" style={{ display: 'none' }}></audio>
            <audio controls="controls" src="sound/select.mp3" id="select" preload="auto" style={{ display: 'none' }}></audio>
            <audio controls="controls" src="sound/bgMusic.mp3" autoPlay="autoplay" id="bgMusic" loop="loop" preload="auto" style={{ display: 'none' }}></audio>
        </div>
    }
}



render(
    <Table />,
    document.getElementById('layout')
)
