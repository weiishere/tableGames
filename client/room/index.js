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
import winCore from '../../server/gameEngine/majiang/winCore';
import tool from '../../server/gameEngine/majiang/rule/tool';

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
let ws = isDebug ? /*io('ws://192.168.31.222:8800')*/io('ws://192.168.31.222:8700') : io('ws://220.167.101.116:3300');

let userInfo = {
    userid: getQueryString('uid'),
    nickname: getQueryString('name') || 'player',
    headimgurl: '/images/games/majiang/head.jpg'//https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=1736960767,2920122566&fm=27&gp=0.jpg
};

let rotateHandler = () => {
    var orientation = (window.innerWidth > window.innerHeight) ? 'landscape' : 'portrait';
    if (orientation === "portrait") {
        $("#layout").addClass('portraitStyle').height(window.innerWidth).width(window.innerHeight).css('transform-origin', window.innerWidth / 2);
        document.querySelector('html').style.fontSize = `${document.body.clientHeight / 60}px`;
    } else {
        document.querySelector('html').style.fontSize = `${document.body.clientWidth / 60}px`;
        $("#layout").removeClass('portraitStyle').height(window.innerHeight).width(window.innerWidth).css('transform-origin', 0);
    }
}
document.querySelector('html').style.fontSize = `${document.body.clientWidth / 60}px`;
window.addEventListener("onorientationchange" in window ? "orientationchange" : "resize", function () {
    window.setTimeout(function () {
        rotateHandler();
    }, 500);
}, false);
$(function () {
    rotateHandler();
});
// window.addEventListener("orientationchange", function () {
//     //console.log(window.orientation);
//     document.querySelector('html').style.fontSize = `${document.body.clientWidth / 60}px`;
// });
// window.addEventListener("onsize", function () {
//     //console.log(window.orientation);
//     document.querySelector('html').style.fontSize = `${document.body.clientWidth / 60}px`;
// });



if (!isDebug) {
    const userInfoCookie = Cookies.get('wxUserInfo');
    if (!userInfoCookie) {
        location.replace('/auth?target=' + escape('room?roomId=' + getQueryString('roomId')));
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
                    link: 'http://www.fanstongs.com/auth?target=' + escape('room?roomId=' + getQueryString('roomId')),//location.href,
                    imgUrl: 'http://www.fanstongs.com/images/games/majiang2/logo.jpeg',
                    success: function () { }
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
                        axios.post('/setLoaction', {
                            roomId: getQueryString('roomId'),
                            uid: userInfo.userid,
                            location: userInfo.location
                        }).then(() => { });
                    }
                });
            });

        }
    });
    axios.post('/api/login', {
        openid: userInfo.openid,//'op9eV0yX5DEg7HU2VX3ttMCKXF_c',
        nickname: decodeURI(userInfo.nickname),//'测试nickName',
        headimgurl: userInfo.headimgurl//'https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=1736960767,2920122566&fm=27&gp=0.jpg'
    }).then((req) => {
        if (!req.data.userid) {
            Toast.info('抱歉，用户信息获取失败...');
            return;
        }
        userInfo['roomcard'] = req.data.roomcard;
        userInfo['score'] = req.data.score;
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
                score: userInfo.score,
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
            notice: false,
            gameOver: false
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
        //this.getlocation = this.getlocation.bind(this);
        //this.heartBeat = this.heartBeat.bind(this);
        this.lastData = { isOver: false };
        this.allGamers = {}
        this.isUpdateTime = false;
        this.bgPlaying = false;
        this.isWatch = false;
        this.allGamer = [];
        //5分钟计算一下距离

        function getDisance(lat1, lng1, lat2, lng2) {
            //lat为纬度, lng为经度
            const toRad = (d) => { return d * Math.PI / 180; }
            var dis = 0;
            var radLat1 = toRad(lat1);
            var radLat2 = toRad(lat2);
            var deltaLat = radLat1 - radLat2;
            var deltaLng = toRad(lng1) - toRad(lng2);
            var dis = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(deltaLat / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(deltaLng / 2), 2)));
            return dis * 6378137;
        }
        window.setTimeout(() => {
            let isCan = true, minDisance = { con: 100000, gamer1: { name: '' }, gamer2: { name: '' } };
            if (this.allGamer.length === 4) {
                this.AllGamer.forEach(gamer => {
                    if (!(gamer && gamer.location)) {
                        isCan = false;
                    }
                });
                if (isCan) {
                    let _allGamer = clone(this.allGamer);
                    for (let i = 1; i < _allGamer.lengt; i++) {
                        let firshGamer = _allGamer.shift();
                        _allGamer.forEach(gamer => {
                            //latitude : '获取中'}</p><p>LO：{this.props.location ? this.props.location.longitude
                            let con = getDisance(firshGamer.location.latitude, firshGamer.location.longitude, gamer.location.latitude, gamer.location.longitude);
                            if (con < minDisance.con) {
                                minDisance.con = con;
                                minDisance.gamer1 = firshGamer;
                                minDisance.gamer2 = gamer;
                            }
                        })
                    }
                    this.setState({
                        toast: '提示-玩家最近距离:‘' + minDisance.gamer1.name + '’与‘' + minDisance.gamer2.name + '’相隔' + minDisance.con
                    });
                }
            }
        }, 300000);
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
        this.setState({ effectShow: data.winCode ? 'effectActive ' + data.winCode : 'effectActive' });
        window.setTimeout(() => {
            $('.winEffect').addClass(this.allGamers['user_' + data.uid]);
        }, 1500);
        window.setTimeout(() => {
            this.setState({ effectShow: '' });
            $('.winEffect').removeClass(this.allGamers['user_' + data.uid]);
            if (data.selfWin) $('.winEffect').removeClass(data.winCode);
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
            countdown: roomOption.countdown,
            roomCards: roomOption.roomCards,
            deskTop: roomOption.deskTop
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
                    break;
                case 'gameData':
                    self.isUpdateTime = true;
                    if (data.content) {
                        newRecore = true;
                        if (data.content.isOver) {
                            if (self.lastData.isOver === false) self.lastData = clone({ room: self.state.room, game: self.state.game, isOver: true });
                            self.setState({ gameOver: true, game: data.content });
                            window.setTimeout(() => {
                                self.setState({ showRecore: true });
                            }, 1500);
                        } else {
                            self.lastData = clone({ room: self.state.room, game: self.state.game, isOver: false });//将room和game缓存下来，用于展示游戏记录（不然其他玩家退出，会刷掉数据）
                            self.setState({ game: data.content, gameOver: false });
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
                        self.winEventEffect({ uid: data.content.uid, winCode: data.content.winCode });
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
            this.setState({ game: null });
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
                    dataIndex: this.state.game.dataIndex,
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

        let me, leftGamer, topGamer, rightGamer, bottomGamer;
        this.allGamer = [me, leftGamer, topGamer, rightGamer];
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
            if (!me) {
                bottomGamer = _gamer.find(g => g.uid !== topGamer.uid && g.uid !== leftGamer.uid && g.uid !== rightGamer.uid);
                this.isWatch = true;
                //console.log(bottomGamer);
            } else {
                if (this.isWatch) {
                    this.isWatch = false;
                    this.setState({
                        toast: '观战模式退出，请注意准备开始游戏哦~'
                    });
                }
            }
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
        const bottomGameState = this.state.game && bottomGamer ? this.state.game.gameState['user_' + bottomGamer.uid] : null;
        return !this.state.isBegin ? <ImgLoader /> : <div style={{ height: '100%', overflow: 'hidden' }}><QueueAnim delay={300} duration={800} animConfig={[
            { opacity: [1, 0], scale: [(1, 1), (0.8, 0.8)] }
        ]} style={{ height: '100%' }}><div key='main' className={`MainTable ${isAllcolorLack} ${this.state.effectShow}`} style={this.state.option.deskTop ? { backgroundImage: 'url(' + this.state.option.deskTop + ')' } : {}} >
                <div className='ruleNameBar'>
                    <svg t="1528129063145" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="994" width="35" height="25" style={{ width: '1.2rem', height: '1.2rem', verticalAlign: 'top' }}><defs><style type="text/css"></style></defs><path d="M512.237056 125.5936L162.612736 456.8064l18.41152 441.61024H825.038336V419.9936l-312.80128-294.4z" fill="#FDDC00" p-id="3812"></path><path d="M162.612736 916.79744V775.97696c64.08192 30.96576 135.68 48.83456 211.6096 48.83456 234.57792 0 430.336-165.70368 476.95872-386.4064h10.63936v478.39232H162.612736z" fill="#F4B03A" p-id="3813"></path><path d="M503.031296 604.01664h18.41152c66.03776 0 119.6032 53.53472 119.6032 119.6032v91.98592c0 66.06848-53.56544 119.6032-119.6032 119.6032h-18.41152c-66.06848 0-119.6032-53.53472-119.6032-119.6032v-91.98592c0-66.06848 53.53472-119.6032 119.6032-119.6032z" fill="#FFFFFF" p-id="3814"></path><path d="M1015.533056 573.1328L533.802496 97.60768a30.79168 30.79168 0 0 0-21.57568-8.8064c-8.05888 0-15.84128 3.18464-21.57568 8.8064L8.930816 573.1328a29.83936 29.83936 0 0 0 0 42.57792c11.90912 11.76576 27.42272 11.76576 39.33184 0L144.221696 512v386.39616c0 16.64 17.53088 36.80256 34.36544 36.80256H849.716736c16.8448 0 30.52544-20.1728 30.52544-36.80256V530.39104l88.33024 85.31968c5.96992 5.87776 15.6672 8.83712 23.5008 8.83712 7.80288 0 16.55808-2.94912 22.51776-8.83712 11.89888-11.76576 12.8512-30.84288 0.94208-42.57792zM604.233216 880.00512H420.230656V677.61152c0-24.90368 29.98272-36.80256 55.1936-36.80256h92.0064c25.22112 0 36.80256 11.90912 36.80256 36.80256v202.3936z m220.81536 0H659.426816l-0.37888-208.27136c0-58.12224-32.75776-86.1184-91.62752-86.1184h-110.3872c-58.86976 0-92.0064 33.88416-92.0064 92.0064v202.3936H199.415296V456.8064c-7.26016 0.08192 0-0.08192 0 0l307.10784-295.31136 318.52544 313.7024v404.80768z" fill="#464646" p-id="3815"></path></svg>
                    房间号：{getQueryString('roomId')}</div>
                <div className='ruleNameBar'>{this.ruleName},{this.state.option.colorType === 2 ? '两' : '三'}门牌,{this.state.option.mulriple}倍</div>
                {this.state.room && <Watchers room={this.state.room} />}
                {me && <Gamer_mine gameOver={this.state.gameOver} game={this.state.game} user={me} room={this.state.room} userState={meGameState} lastOutCardKey={this.state.game && this.state.game.lastShowCard ? this.state.game.lastShowCard.key : ''} readyCallback={this.readyCallback} />}
                {bottomGamer && <Gamer_Bottom game={this.state.game} user={bottomGamer} room={this.state.room} userState={bottomGameState} lastOutCardKey={this.state.game && this.state.game.lastShowCard ? this.state.game.lastShowCard.key : ''} />}
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
            {
                !this.state.keepVertical && <div className='orientationWeak' style={{ display: 'none' }}>
                    <span>
                        为了更好的游戏体验，请打开手机的允许屏幕旋转开关，Android用户还需在微信中进行设置：我->设置->通用->开启横屏模式
                    <br /><br />
                        <a href='javascript:;' onClick={() => {
                            this.setState({ keepVertical: true })
                        }}>坚持竖屏</a>
                    </span>
                </div>
            }
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
        </QueueAnim >
            <Sound />
            <Toast key='toast' content={this.state.toast} onHide={() => { this.setState({ toast: '' }) }} />
            {this.state.notice && <div className='notice'><marquee >掌派桌游正式公测，无需房卡免费开房，欢迎玩家踊跃试玩，测试版本可能存在尚未发现的错误，若游戏期间出现问题望请理解，同时您也可以将问题截图发到我们的公众号，验证为有效bug将奖励50张房卡(公测期间每晚1:00~2:00点为固定系统维护期，可能会出现不稳定的情况，玩家请尽量绕开此时段游戏，感谢您的试玩！)</marquee></div>}
        </div >
    }
}
class Watchers extends Component {
    constructor(props) {
        super(props);
    }
    componentDidMount() {

    }
    render() {
        return <div className='watcherWrap'>
            {this.props.room.watchers.map(watcher => <div key={watcher.uid} className='watchersItem'><img src={watcher.avatar} /></div>)}
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
        //if (this.myEvent && this.props.room.state !== 'wait') {
        if (this.myEvent) {
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
            {this.state.active && <div className='Allscore'>{this.props.score}</div>}
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
            hadOutCardKey: '',//用于马上打出去的牌
            userState: null,
            showWinCardsPanel: true,
            isShowColorChoosePanel: false
        }
        this.cardHandler = false;
        this.isLack = false;
        this.addConcatCard = [];
        this.ready = this.ready.bind(this);
        this.clickHandle = this.clickHandle.bind(this);
        this.showCard = this.showCard.bind(this);
        this.chooseColor = this.chooseColor.bind(this);
        this.getMinColor = this.getMinColor.bind(this);
        this.getWinCard = this.getWinCard.bind(this);
        this.winCards = [];
        this.fetchCard_tran = true;
        this.minColor = '';
    }
    // shouldComponentUpdate(nextProps) {
    //     if ((this.props.game && nextProps.game && this.props.room && nextProps.room && this.props.game.dataIndex === nextProps.game.dataIndex) && (this.props.room && this.props.room.dataIndex === nextProps.room.dataIndex)) {
    //         return false;
    //     }
    //     return true;
    // }
    getWinCard(activeCard, targetProps) {
        //要验证的牌（除去缺的牌）
        let validateCards = [];
        let winResultCard = [];
        const _props = targetProps || this.props;
        ['w', 't', 'b'].filter(item => item !== _props.userState.colorLack).forEach(color => {
            for (let i = 1; i <= 9; i++) { validateCards.push({ key: color + i, number: i, color: color }); }
        });
        ['hz', 'fc', 'bb'].forEach((color, i) => {
            validateCards.push({ key: color + i, number: 1, color: color });
        });
        let _cards = clone(_props.userState.cards);
        _props.userState.fatchCard && _cards.push(_props.userState.fatchCard);
        _cards = _cards.filter(card => card.key !== activeCard.key);
        for (let i = 0; i < validateCards.length; i++) {
            const __cards = _cards.concat(validateCards[i]).sort(tool.objectArraySort('key'));
            validateCards[i].remainCount = 4;
            if (winCore(__cards, _props.userState.colorLack)) winResultCard.push(validateCards[i]);
        }
        //console.log(winResultCard);
        if (winResultCard.length !== 0) {
            //取得所有打出去的牌和已经碰杠的牌
            for (let i in _props.game.gameState) {
                const _gameState = _props.game.gameState[i];
                let vaCards = clone(_gameState.outCards);
                _gameState.groupCards.meet.forEach(meetArr => {
                    vaCards = vaCards.concat(meetArr);
                })
                _gameState.groupCards.fullMeet.forEach(meetArr => {
                    vaCards = vaCards.concat(meetArr);
                })
                vaCards.forEach(c => {
                    winResultCard.forEach(vc => {
                        if (vc.color === c.color && vc.number === c.number) {
                            vc.remainCount--;
                        }
                    })
                });
            }
            _props.userState.cards.forEach(c => {
                winResultCard.forEach(vc => {
                    if (vc.color === c.color && vc.number === c.number) {
                        vc.remainCount--;
                    }
                })
            });
        }
        //console.log(activeCard);
        this.winCards = winResultCard;
    }
    ready() {
        //console.log('ready:' + this.minColor);
        if (this.cardHandler) return;
        this.cardHandler = true;
        const self = this;
        this.props.readyCallback();
        //$('.cardListWrap .card').remove();
        this.setState({ userState: null, activeCard: {} });
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
        // let ac = this.state.activeCard;
        // console.log(this.state.activeCard);
        // if (nextProps.userState && nextProps.userState.fatchCard) {
        //     if (JSON.stringify(this.state.activeCard) !== '{}') {
        //         ac = this.state.activeCard;
        //     } else {
        //         if (nextProps.game && nextProps.userState.catcher) {
        //             ac = nextProps.userState.fatchCard;
        //         }
        //     }
        // }
        // if (nextProps.game && nextProps.game.event === 'meet') {
        //     ac = nextProps.userState.cards[nextProps.userState.cards.length - 1];
        // }
        //console.log(this.state.activeCard);
        let ac = {};
        this.winCards = [];
        if (JSON.stringify(this.state.activeCard) === '{}') {
            ac = (nextProps.userState && nextProps.userState.fatchCard || (nextProps.game && nextProps.userState.catcher && nextProps.game.event === 'meet' ? nextProps.userState.cards[nextProps.userState.cards.length - 1] : {}));
            if (nextProps.userState && nextProps.userState.fatchCard) {
                if (nextProps.game && nextProps.userState.fatchCard.color !== nextProps.userState.colorLack && concatCard(nextProps.userState).filter(card => card.color === nextProps.userState.colorLack).length !== 0 && nextProps.userState.catcher) {
                    ac = nextProps.userState.cards[nextProps.userState.cards.length - 1];
                }
            }

        } else {
            ac = this.state.activeCard;
        }
        if (nextProps.userState && nextProps.userState.catcher && this.isLack) {
            this.setState({
                showWinCardsPanel: true
            })
            this.getWinCard(ac, nextProps);
        }
        this.setState({
            buttonVisible: false,//nextProps.userState.actionCode.length === 0 ? true : false,
            //activeCard: (nextProps.userState && JSON.stringify(this.state.activeCard) !== '{}' ? this.state.activeCard : (nextProps.userState.fatchCard || (nextProps.game && nextProps.userState.catcher && nextProps.game.event === 'meet' ? nextProps.userState.cards[nextProps.userState.cards.length - 1] : {}))),
            //activeCard: (nextProps.userState && nextProps.userState.fatchCard || (nextProps.game && nextProps.userState.catcher && nextProps.game.event === 'meet' ? nextProps.userState.cards[nextProps.userState.cards.length - 1] : {})),
            activeCard: ac,
            hadOutCardKey: '',
            userState: nextProps.userState
        });
        if (nextProps.userState && !nextProps.userState.colorLack) {
            window.setTimeout(() => {
                this.setState({
                    isShowColorChoosePanel: true
                })
            }, 2000);
        } else {
            this.setState({
                isShowColorChoosePanel: false
            })
        }
        if (!this.props.game) this.minColor = '';
        this.fetchCard_tran = true;

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
        try {
            //if (this.cardHandler) return;
            
            if (JSON.stringify(this.state.activeCard) === '{}') return;
            this.cardHandler = true;
            const _concatCard = concatCard(this.props.userState);
            const _isLack = _concatCard.filter(card => card.color === this.props.userState.colorLack).length === 0 ? true : false;
            const _showCard = _concatCard.find(card => card.key === this.state.activeCard.key);
            if (!_showCard) return;
            if (!this.props.userState.catcher || (this.props.userState.colorLack !== _showCard.color && !_isLack)) {
                this.setState({ activeCard: {}, buttonVisible: false });
                this.cardHandler = false;
                return false;
            }

            //必须在打缺了的情况下，或者打的缺花色的牌，才通过
            if (_showCard.color === this.props.userState.colorLack || this.isLack) {
                this.cardHandler = false;
                const activeCard_key = this.state.activeCard.key;
                this.setState({ activeCard: {}, hadOutCardKey: activeCard_key });
                if(this.props.game.isOver) return;
                ws.emit('showCard', JSON.stringify({
                    roomId: this.props.room.roomId,
                    uid: this.props.user.uid,
                    cardKey: activeCard_key,
                    fromUser: true,
                    isCancleAction: order === 'cancleAction' ? true : false
                }));
                //考虑到流畅性，打完前端马上去掉这个牌
                if (isIOS) {
                    playSound('showCard');
                }
            }
        } catch (e) {
            //console.log();
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
        this.cardHandler = true;
        //点击了就马上隐藏按钮，免得再多生事端
        this.setState({ buttonVisible: true, fmChooseCardKey: [], activeCard: {} }, () => {
            ws.emit('action', JSON.stringify({
                roomId: this.props.room.roomId,
                uid: this.props.user.uid,
                actionType: type,
                dataIndex: this.props.game.dataIndex,
                doCardKey: doCardKey
            }));
        });
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
                dataIndex: this.props.game.dataIndex,
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
                if (this.props.userState.fatchCard && this.state.activeCard.key !== this.props.userState.fatchCard.key) this.fetchCard_tran = false;
                if (this.props.userState.actionCode.length !== 0) {
                    this.showCard('cancleAction');
                } else {
                    this.showCard();
                }
                // if (this.props.userState.catcher) {
                //     this.setState({ activeCard: card });
                // } else {
                //     this.setState({ activeCard: {}, buttonVisible: false });
                // }
            } else {
                if (this.props.userState.catcher) {
                    //获取胡牌
                    this.getWinCard(card);
                }
                this.setState({ activeCard: card, showWinCardsPanel: true });
            }
        }

        //console.log('clickHandle');
        playSound('select');
    }
    chooseColor(color) {
        this.setState({
            buttonVisible: true,
            //isShowColorChoosePanel: false
        });
        ws.emit('chooseColor', JSON.stringify({
            roomId: this.props.room.roomId,
            uid: this.props.user.uid,
            color: color
        }));
    }
    getMinColor() {
        let minColor = '', min = 100;
        if (this.props.userState) {
            //this.addConcatCard = concatCard(this.props.userState);
            this.isLack = concatCard(this.props.userState).filter(card => card.color === this.props.userState.colorLack).length === 0 ? true : false;
            let minColorObj = { b: 0, t: 0, w: 0 };
            this.props.userState.cards.forEach(card => {
                minColorObj[card.color]++;
            });
            ['b', 't', 'w'].forEach(item => {
                if (minColorObj[item] < min) {
                    minColor = item;
                    min = minColorObj[item];
                }
            });
            const getCardCon = (c) => {
                const cards = this.props.userState.cards.filter(card => card.color === c);
                let conSum = 0;
                let lastCard = null;
                //console.log(cards);
                cards.forEach(card => {
                    if (lastCard) {
                        conSum += Math.abs(lastCard.number - card.number);
                        //console.log(lastCard,card,conSum);
                    }
                    lastCard = card;
                });

                return conSum;
            }
            const minColorCopy = minColor;
            let con1 = getCardCon(minColor);
            ['b', 't', 'w'].filter(c => c !== minColor).forEach(c => {
                if (minColorObj[minColorCopy] === minColorObj[c]) {
                    //如果推荐的牌色跟其他数量相同，则按照牌色最小差额推荐
                    const con2 = getCardCon(c);
                    if (con2 > con1) {
                        minColor = c;
                        con1 = con2;
                    }
                }
            });
        }
        return minColor;
    }
    render() {
        //console.log(this.state.activeCard);
        if (!this.minColor) {
            this.minColor = this.getMinColor();
        }
        if (this.props.userState) {
            this.isLack = concatCard(this.props.userState).filter(card => card.color === this.props.userState.colorLack).length === 0 ? true : false;
        }
        const ready = <div key='ready' onClick={this.ready} className='btu ready'></div>
        const btu_showCard = <div key='showCard' onClick={this.showCard} className={`btu showCard ${this.state.activeCard.key && 'active'}`}></div>
        const btu_meet = <div key='meet' onClick={() => this.actionHandler('meet')} className='btu meet'></div>;//碰
        const btu_fullMeet = <div key='fullMeet' onClick={() => this.actionHandler('fullMeet')} className='btu fullmeet'></div>;//杠
        const btu_win = <div key='winning' onClick={() => this.actionHandler('winning')} className='btu win'></div>;//胡牌
        const btu_pass = <div key='pass' onClick={() => this.actionHandler('pass')} className='btu pass' ></div>;//过


        const lackColorChoose = <div key='ColorChoose'>
            <div key='b' className={`btu chooseColor chooseB ${this.minColor === 'b' && 'mark'}`} onClick={() => this.chooseColor('b')}></div>
            <div key='t' className={`btu chooseColor chooseT ${this.minColor === 't' && 'mark'}`} onClick={() => this.chooseColor('t')}></div>
            <div key='w' className={`btu chooseColor chooseW ${this.minColor === 'w' && 'mark'}`} onClick={() => this.chooseColor('w')}></div>
        </div>
        //this.props.userState && console.log(this.props.userState);
        return <div className='gamerWrap_mine'>
            <GamerDock  {...this.props.user} room={this.props.room} userState={this.props.userState} />
            {this.props.userState && <div className='cardListWrap' >
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
                <QueueAnim delay={0} duration={500} type={['top']} className='cardsMineWrap' style={{ width: `${this.props.userState.cards.length * 7.2}%` }} leaveReverse>
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
                    {this.props.userState.fatchCard && <div key='fetchCard' className={`fetchCard ${!this.fetchCard_tran && 'fetchCard_tran'}`}>
                        <Card activeKey={this.state.activeCard.key} clickHandle={this.clickHandle}
                            type={`mine_main ${!this.isLack && (this.props.userState.colorLack !== this.props.userState.fatchCard.color || (this.state.fmChooseCardKey.length > 1 && this.state.fmChooseCardKey.indexOf(card.key) === -1)) ? 'gray' : ''} stress`}
                            card={this.props.userState.fatchCard}></Card>
                    </div>}
                </QueueAnim>
                <div className='winDesc'>{this.props.userState.winDesc}</div>
                {this.state.showWinCardsPanel && this.props.userState.catcher && this.winCards.length !== 0 && <div className='winWeakWrap' onClick={() => {
                    this.setState({ showWinCardsPanel: false });
                }}>
                    {this.winCards.map(__card => <div key={__card.key} className='winWeakItem'>
                        <Card
                            key={`card_win_${__card.key}`}
                            type={`mine_win`}
                            card={__card}>
                        </Card>
                        <div>剩余:{__card.remainCount}</div>
                    </div>)}
                    {/* <div className='winWeakItem'>
                        <Card
                            type={`mine_win`}
                            card={{ color: 'b', key: 'card-b-9-12', number: 9 }}>
                        </Card>
                        <div>剩余：1</div>
                    </div>
                    <div className='winWeakItem'>
                        <Card
                            type={`mine_win`}
                            card={{ color: 'b', key: 'card-b-9-12', number: 9 }}>
                        </Card>
                        <div>剩余：1</div>
                    </div> */}
                </div>}
                {/* <div className='winDesc'>{this.props.userState.winDesc && this.props.userState.winDesc.indexOf(':') ? this.props.userState.winDesc.split(':')[1] : this.props.userState.winDesc}</div> */}
            </div>}
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
                    {this.props.userState && !this.props.userState.colorLack && this.state.isShowColorChoosePanel && lackColorChoose}
                    {this.props.user.state !== 'wait' && this.props.room.state !== 'wait' && this.props.userState && this.props.userState.catcher && this.props.userState.actionCode.length === 0 && (this.state.activeCard.key || this.props.game.event === 'meet') && btu_showCard}
                    {
                        //这里可能会不显示操作面板（如果是碰，但是又有玩家要胡牌）
                        this.props.userState && !this.props.game.isOver && this.props.userState.actionCode.map(action => {
                            if (action === 'meet' && !this.props.userState.isPause) return btu_meet;
                            if (action === 'fullMeet' && !this.props.userState.isPause) return btu_fullMeet;
                            if (action === 'winning' && !this.props.gameOver) return btu_win;
                        })
                    }
                    {this.props.userState && this.props.user.state !== 'wait' && !this.props.userState.isPause && this.props.userState.actionCode.length !== 0 && btu_pass}
                </div> : ''}
                {<div className={`loadingPanel ${this.state.buttonVisible && 'action'}`}>loading</div>}
            </QueueAnim>
        </div>
    }
}
class Gamer_Bottom extends Component {
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
        return <div className='gamerWrap_mine gamerWrap_bottom'>
            <GamerDock {...this.props.user} room={this.props.room} userState={this.props.userState} />
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
            <div className='bottomWeak'>观战模式</div>
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
            <GamerDock {...this.props.user} room={this.props.room} userState={this.props.userState} />
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
            {this.props.userState && <QueueAnim delay={0} duration={500} type={['bottom']} className='outCardListWrap'>
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
            <GamerDock {...this.props.user} room={this.props.room} userState={this.props.userState} />
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
            {this.props.userState && <QueueAnim delay={0} duration={500} type={['bottom']} className='outCardListWrap'>
                {this.props.userState.outCards.map((card, index) =>
                    <div style={{ display: 'inline-block', zIndex: 100 - index }} key={`out_${card.key}`}><Card type={`mine_main_out ${this.props.lastOutCardKey === card.key ? 'mark' : ''}`} card={card}></Card></div>)
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
            <GamerDock {...this.props.user} room={this.props.room} userState={this.props.userState} />
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
            {this.props.userState && <QueueAnim delay={0} duration={500} type={['bottom']} className='outCardListWrap'>
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
        if (nextProps.activeKey !== this.props.activeKey) {
            return true;
        }
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
                            <div className={this.props.user && gamer.uid === this.props.user.uid ? `self` : ''}>
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
                    {this.props.user && this.props.room.state !== 'end' && this.props.isOver && <button className='closeBtu ready' style={{ marginBottom: 0, marginLeft: 10 }} onClick={() => { this.props.closeHandle('ready') }}></button>}
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
                    <center><h3>《掌派桌游许可及服务协议》</h3></center>
（以下简称“本协议”）由您与掌派桌游服务提供方共同缔结，本协议具有合同效力。

请您务必审慎阅读、充分理解各条款内容，特别是免除或者限制掌派责任的条款（以下称“免责条款”）、
对用户权利进行限制的条款（以下称“限制条款”）、约定争议解决方式和司法管辖的条款，以及开通或使用某项服务的单独协议。<br/>
前述免责、限制及争议解决方式和管辖条款可能以黑体加粗、颜色标记或其他合理方式提示您注意，
包括但不限于本协议第二条、第三条、第四条、第六条、第九条等相关条款，您对该等条款的确认将可能导致您在特定情况下的被动、
不便、损失，请您在确认同意本协议之前或在使用掌派桌游服务之前再次阅读前述条款。双方确认前述条款并非属于《合同法》第40条规定的“免除其责任、加
重对方责任、排除对方主要权利的”的条款，并同意该条款的合法性及有效性。
除非您已阅读并接受本协议所有条款，否则您无权使用掌派桌游服务。<br/><br/>

如果您对本协议或掌派游戏服务有意见或建议，可与掌派客户服务部门联系，我们会给予您必要的帮助。
您点击同意、接受或下一步，或您注册、使用掌派桌游服务均视为您已阅读并同意签署本协议。<br/><br/>

如果您未满18周岁，请在法定监护人的陪同下阅读本协议，并特别注意未成年人使用条款。
如您为未成年人法定监护人，希望合理设定孩子娱乐时间，培养孩子健康游戏习惯的<br/><br/>

一、【定义】<br/>
1.1 本协议：指本协议正文、《掌派服务协议》、《掌派隐私政策》、游戏规则及其修订版本。<br/>
上述内容一经正式发布，即为本协议不可分割的组成部分。<br/>
本协议同时还包括文化部根据《网络游戏管理暂行办法》（文化部令第49号）制定的《网络游戏服务格式化协议必备条款》。<br/><br/>

1.2 游戏规则：指掌派桌游服务提供方不时发布并修订的关于掌派桌游的用户守则、玩家条例、游戏公告、提示及通知等内容。<br/>

1.3 掌派桌游服务提供方：指向您提供掌派桌游及其服务的成都市氪金科技有限公司，在本协议中简称为“掌派”。<br/>

1.4 掌派桌游：指由掌派负责运营的游戏的统称<br/>

1.5 掌派桌游服务：指掌派向您提供的与游戏相关的各项在线运营服务。<br/>

1.6 您：又称“玩家”或“用户”，指被授权使用掌派桌游及其服务的自然人。<br/>

1.7 游戏数据：指您在使用掌派桌游过程中产生的被服务器记录的各种数据，包括但不限于角色数据、虚拟物品数据、行为日志、购买日志等等数据<br/><br/>

二、【用户信息收集、使用及保护】<br/>
2.1 您同意并授权掌派为履行本协议之目的收集您的用户信息，这些信息包括您在实名注册系统中注册的信息、您游戏账号下的游戏数据以及其他您在使用掌派桌游服务的过程中向掌派提供或掌派基于安全、用户体验优化等考虑而需收集的信息，掌派对您的用户信息的收集将遵循本协议及相关法律的规定。<br/>

2.2 您充分理解并同意：掌派或其合作的第三方可以根据您的用户信息，通过短信、电话、邮件等各种方式向您提供关于掌派桌游的活动信息、推广信息等各类信息。<br/>

2.3 您理解并同意：为了更好地向您提供游戏服务，改善游戏体验，掌派可对您微信账号或游戏账号中的昵称、头像以及在掌派桌游中的相关操作信息、游戏信息等信息（以下称“该等信息”。该等信息具体包括但不限于您的登录状态、对战信息/状态、成就信息等）进行使用，并可向您本人或其他用户或好友展示该等信息。<br/>

2.4 您应对通过掌派桌游及相关服务了解、接收或可接触到的包括但不限于其他用户在内的任何人的个人信息予以充分尊重，您不应以搜集、复制、存储、传播或以其他任何方式使用其他用户的个人信息，否则，由此产生的后果由您自行承担。<br/>

2.5 保护用户信息及隐私是掌派的一项基本原则。<br/><br/>

三、【掌派桌游服务】<br/>
3.1 在您遵守本协议及相关法律法规的前提下，掌派给予您一项个人的、不可转让及非排他性的许可，以使用掌派桌游服务。您仅可为非商业目的使用掌派桌游服务，包括：<br/>

（1）接收、启动、登录、显示、运行和/或截屏掌派桌游；<br/>

（2）设置网名，查阅游戏规则、游戏对局结果，开设游戏房间、设置游戏参数，使用聊天功能、社交分享功能；<br/>

（3）使用掌派桌游支持并允许的其他某一项或几项功能。<br/>

3.2 您在使用掌派桌游服务过程中不得未经掌派许可以任何方式录制、直播或向他人传播掌派桌游内容，包括但不限于不得利用任何第三方软件进行网络直播、传播等。<br/>

3.3 在掌派桌游以软件形式提供的情况下，您在使用掌派桌游及掌派桌游服务时还应符合本协议第五条关于软件许可的规定。<br/>

3.4 本条及本协议其他条款未明示授权的其他一切权利仍由掌派保留，您在行使这些权利时须另外取得掌派的书面许可。<br/>

3.5 如果您违反本协议约定的，掌派有权采取相应的措施进行处理，该措施包括但不限于：<br/>
不经通知随时对相关内容进行删除，并视行为情节对违规游戏账号处以包括但不限于警告、
限制或禁止使用全部或部分功能、游戏账号封禁直至注销的处罚，并公告处理结果，
要求您赔偿因您从事违约行为而给掌派造成的损失等。<br/>

3.6 您充分理解并同意，掌派有权依合理判断对违反有关法律法规或本协议规定的行为进行处理，<br/>
对违法违规的任何用户采取适当的法律行动，并依据法律法规保存有关信息向有关部门报告等，用户应独自承担由此而产生的一切法律责任。<br/>

3.7 您充分理解并同意，因您违反本协议或相关服务条款的规定，导致或产生第三方主张的任何索赔、
要求或损失，您应当独立承担责任；掌派因此遭受损失的，您也应当一并赔偿。
您充分理解并同意：为更好地向用户提供掌派桌游服务，掌派有权对游戏中的任何内容或构成元素等作出调整、更新或优化。
且如掌派做出相应调整、更新或优化的，您同意不会因此追究掌派的任何法律责任。<br/>

3.8 掌派将按照相关法律法规和本协议的规定，采取切实有效的措施保护未成年人在使用掌派桌游服务过程中的合法权益，
包括可能采取技术措施、禁止未成年人接触不适宜的游戏或者游戏功能、限制未成年人的游戏时间、预防未成年人沉迷网络。
作为游戏规则的一部分，掌派还将在适当位置发布掌派桌游用户指引和警示说明，包括游戏内容介绍、正确使用游戏的方法以及防止危害发生的方法。
所有未成年人用户都应在法定监护人的指导下仔细阅读并遵照执行这些指引和说明；其他玩家在使用掌派桌游服务的过程中应避免发布、产生任何有损未成年人身心健康的内容，共同营造健康游戏环境。
3.9 如果您未满18周岁的，为保障您的合法权益，掌派有权依据国家有关法律法规及政策规定、本协议其他条款规定、掌派桌游运营策略或根据您法定监护人的合理要求采取以下一种或多种措施：<br/>

（1）将与您游戏相关的信息（包括但不限于您游戏帐号的登录信息、充值流水信息等）提供给您的法定监护人，使得您法定监护人可及时或同步了解您游戏情况；<br/>

（2）限制您游戏账号的消费额度；<br/>

（3）采取技术措施屏蔽某些游戏或游戏的某些功能，或限定您游戏时间或游戏时长；<br/>

（4）注销或删除您游戏账号及游戏数据等相关信息；<br/>

（5）您法定监护人要求采取的，或掌派认为可采取的其他合理措施，以限制或禁止您使用掌派桌游。<br/>

3.10 掌派向用户提供游戏服务本身属于商业行为，
用户有权自主决定是否根据掌派自行确定的收费项目（包括但不限于购买游戏内的虚拟道具的使用权以及接受其他增值服务等各类收费项目）及收费标准支付相应的费用，
以获得相应的游戏服务。如您不按相应标准支付相应费用的，您将无法获得相应的游戏服务。<br/>

您知悉并同意：收费项目或收费标准的改变、调整是一种正常的商业行为，您不得因为收费项目或收费标准的改变、调整而要求掌派进行赔偿或补偿。<br/>

3.11 在任何情况下，掌派不对因不可抗力导致的您在使用掌派桌游服务过程中遭受的损失承担责任。
该等不可抗力事件包括但不限于国家法律、法规、政策及国家机关的命令及其他政府行为或者其它的诸如地震、水灾、雪灾、火灾、海啸、台风、罢工、战争等不可预测、不可避免且不可克服的事件。<br/>

3.12 掌派桌游可能因游戏软件BUG、版本更新缺陷、第三方病毒攻击或其他任何因素导致您的游戏账号数据发生异常。
在数据异常的原因未得到查明前，掌派有权暂时冻结该游戏账号；若查明数据异常为非正常游戏行为所致，
掌派有权恢复游戏账号数据至异常发生前的原始状态（包括向第三方追回被转移数据），且掌派无须向您承担任何责任。<br/>

3.13 掌派未授权您从任何第三方通过购买、接受赠与或者其他的方式获得游戏账号掌派不对第三方交易的行为负责，并且不受理因任何第三方交易发生纠纷而带来的申诉。<br/>

3.14 您充分理解到：掌派桌游中可能会设置强制对战区域或玩法，如果您不同意强制对战，请您不要进入该游戏或游戏区域；您的进入，将被视为同意该玩法并接受相应后果。<br/>

3.15 掌派自行决定终止运营掌派桌游时或掌派桌游因其他任何原因终止运营时，掌派会按照文化部有关网络游戏终止运营的相关规定处理游戏终止运营相关事宜，以保障用户合法权益。<br/><br/>

四、【软件许可】<br/>
4.1 使用掌派桌游服务可能需要下载并安装相关软件，您可以直接从掌派的相关网站上获取该软件，也可以从得到掌派授权的第三方获取。如果您从未经掌派授权的第三方获取掌派桌游或与掌派桌游名称相同的游戏，将视为您未获得掌派授权，掌派无法保证该游戏能够正常使用，并对因此给您造成的损失不予负责。<br/>


4.2 若掌派桌游以软件形式提供，掌派给予您一项个人的、不可转让及非排他性的许可。您仅可为非商业目的在单一台终端设备上下载、安装、登录、使用该掌派桌游。<br/>

4.3 为提供更加优质、安全的服务，在软件安装时掌派可能推荐您安装其他软件，您可以选择安装或不安装。<br/>

4.5 如果您不再需要使用该软件或者需要安装新版，可以自行卸载。如果您愿意帮助掌派改进产品服务，请告知卸载的原因。<br/>

4.6 为了保证掌派桌游服务的安全性和功能的一致性，掌派有权对软件进行更新，或者对软件的部分功能效果进行改变或限制。<br/><br/>

五、【用户行为规范】<br/>
5.1 您充分了解并同意，您必须为自己游戏账号下的一切行为负责，包括您所发表的任何内容以及由此产生的任何后果。<br/>

5.2 您除了可以按照本协议的约定使用掌派桌游服务之外，不得进行任何侵犯掌派桌游的知识产权的行为，或者进行其他的有损于掌派或其他第三方合法权益的行为。<br/>

5.3 您在使用掌派桌游或掌派桌游服务时须遵守法律法规，不得利用掌派桌游或掌派桌游服务从事违法违规行为，包括但不限于以下行为：<br/>

（一）违反宪法确定的基本原则的；<br/>

（二）危害国家统一、主权和领土完整的；<br/>

（三）泄露国家秘密、危害国家安全或者损害国家荣誉和利益的；<br/>

（四）煽动民族仇恨、民族歧视，破坏民族团结，或者侵害民族风俗、习惯的；<br/>

（五）宣扬邪教、迷信的；<br/>

（六）散布谣言，扰乱社会秩序，破坏社会稳定的；<br/>

（七）宣扬淫秽、色情、赌博、暴力，或者教唆犯罪的；<br/>

（八）侮辱、诽谤他人，侵害他人合法权益的；<br/>

（九）违背社会公德的；<br/>

（十）有法律、行政法规和国家规定禁止的其他内容的。<br/>

5.4 除非法律允许或掌派书面许可，您不得从事下列行为：<br/>

（1）删除游戏软件及其副本上关于著作权的信息；<br/>

（2）对游戏软件进行反向工程、反向汇编、反向编译或者以其他方式尝试发现软件的源代码；<br/>

（3）对游戏软件进行扫描、探查、测试，以检测、发现、查找其中可能存在的BUG或弱点；<br/>

（4）对游戏软件或者软件运行过程中释放到任何终端内存中的数据、软件运行过程中客户端与服务器端的交互数据，以及软件运行所必需的系统数据，进行复制、修改、增加、删除、挂接运行或创作任何衍生作品，形式包括但不限于使用插件、外挂或非经合法授权的第三方工具/服务接入软件和相关系统；<br/>

（5）修改或伪造软件运行中的指令、数据，增加、删减、变动软件的功能或运行效果，或者将用于上述用途的软件、方法进行运营或向公众传播，无论上述行为是否为商业目的；<br/>

（5）通过非掌派开发、授权的第三方软件、插件、外挂、系统，使用掌派桌游及掌派桌游服务，或制作、发布、传播非掌派开发、授权的第三方软件、插件、外挂、系统；<br/>

（7）对游戏中掌派拥有知识产权的内容进行使用、出租、出借、复制、修改、链接、转载、汇编、发表、出版、建立镜像站点等；<br/>

（8）建立有关掌派桌游的镜像站点，或者进行网页（络）快照，或者利用架设服务器等方式，为他人提供与掌派桌游服务完全相同或者类似的服务；<br/>

（9）将掌派桌游的任意部分分离出来单独使用，或者进行其他的不符合本协议的使用；<br/>

（10）使用、修改或遮盖掌派桌游的名称、商标或其它知识产权；<br/>

（11）其他未经掌派明示授权的行为。
5.5 您在使用掌派桌游服务过程中有如下任何行为的，掌派有权视情节严重程度，依据本协议及相关游戏规则的规定，对您做出永久性地禁止登录（即封号）、删除游戏账号及游戏数据、删除相关信息等处理措施，情节严重的将移交有关行政管理机关给予行政处罚，或者追究您的刑事责任：<br/>

（1）以某种方式暗示或伪称掌派内部员工或某种特殊身份，企图得到不正当利益或影响其他用户权益的行为；<br/>

（2）在掌派桌游中使用非法或不当词语、字符等，包括用于角色命名；<br/>

（3）以任何方式破坏掌派桌游或影响掌派桌游服务的正常进行；<br/>

（4）各种非法外挂行为；<br/>

（5）传播非法言论或不当信息；<br/>

（6）盗取他人游戏账号、游戏物品；<br/>

（7）私自进行游戏账号交易；<br/>

（8）私自进行游戏虚拟货币、游戏装备、游戏币及其他游戏道具等交易；<br/>

（9）违反本协议任何约定的；<br/>

（10）其他在行业内被广泛认可的不当行为，无论是否已经被本协议或游戏规则明确列明。<br/>

（11）使用本平台赌博者<br/>

您知悉并同意，由于外挂具有隐蔽性或用完后即消失等特点，掌派有权根据您的游戏数据和表现异常判断您有无使用非法外挂等行为。<br/>

5.6 您知悉并同意，如掌派依据本协议对您的游戏账号采取封号处理措施。<br/><br/>

六、【知识产权】<br/>
6.1 掌派是掌派桌游的知识产权权利人。<br/>
掌派桌游（包括掌派桌游整体及掌派桌游涉及的所有内容、组成部分或构成要素 ）的一切著作权、商标权、专利权、商业秘密等知识产权及其他合法权益，
以及与掌派桌游相关的所有信息内容（包括文字、图片、音频、视频、图表、界面设计、版面框架、有关数据或电子文档等）均受中华人民共和国法律法规和相应的国际条约保护，
掌派享有上述知识产权和合法权益，但相关权利人依照法律规定应享有的权利除外。未经掌派事先书面同意，
您不得以任何方式将掌派桌游（包括掌派桌游整体及掌派桌游涉及的所有内容、组成部分或构成要素 ）进行商业性使用。<br/>

6.2 尽管本协议有其他规定，您在使用掌派桌游服务中产生的游戏数据的所有权和知识产权归掌派所有，掌派有权保存、处置该游戏数据。
其中，掌派对用户购买游戏虚拟货币的购买记录的保存期限将遵守文化部《网络游戏管理暂行办法》有关规定。对其他游戏数据的保存期限由掌派自行决定，但国家法律法规另有规定的从其规定。<br/>

6.3 掌派桌游可能涉及第三方知识产权，而该等第三方对您基于本协议在掌派桌游中使用该等知识产权有要求的，掌派将以适当方式向您告知该要求，您应当一并遵守。<br/><br/>

七、【遵守当地法律监管】<br/>
7.1 您在使用掌派桌游服务过程中应当遵守当地相关的法律法规，并尊重当地的道德和风俗习惯。如果您的行为违反了当地法律法规或道德风俗，您应当为此独立承担责任。<br/>

7.2 您应避免因使用掌派桌游服务而使掌派卷入政治和公共事件，否则掌派有权暂停或终止对您的服务。<br/><br/>


八、【管辖与法律适用】<br/>
8.1 本协议签订地为中华人民共和国四川省成都市青羊区。<br/>

8.2 本协议的成立、生效、履行、解释及纠纷解决，适用中华人民共和国大陆地区法律（不包括冲突法）。<br/>

8.3 若您和掌派之间因本协议发生任何纠纷或争议，首先应友好协商解决；协商不成的，您同意将纠纷或争议提交至本协议签订地有管辖权的人民法院管辖。<br/>

8.4 本协议所有条款的标题仅为阅读方便，本身并无实际涵义，不能作为本协议涵义解释的依据。<br/>

8.5 本协议条款无论因何种原因部分无效，其余条款仍有效，对各方具有约束力。<br/><br/>

九、【其他】<br/>
9.1 掌派有权在必要时变更本协议条款，您可以在掌派桌游的相关页面查阅最新版本的协议条款。本协议条款变更后，如果您继续使用掌派桌游服务，即视为您已接受变更后的协议。<br/>

9.2 根据国家新闻出版总署关于健康游戏的忠告，掌派提醒您：抵制不良游戏，拒绝盗版游戏；注意自我保护，谨防受骗上当；适度游戏益脑，沉迷游戏伤身。<br/>
                </div>
            },
            {
                key: 'chengdu',
                name: '成都麻将',
                content: <div>
                    <center><h3>成都麻将胡牌规则</h3></center>
                    平胡：普通的胡牌，不包括以下规则任何一种特征，为平胡，不计番数。<br/>
自摸：牌局上所有未胡牌者加一番，即两倍。<br/>
点炮：不计番数，点炮者输分数。<br/>
大对子：“对子胡”，加1番，带一杠加一番。<br/>
暗七对，加上胡牌14张牌全为对子，且无碰杠，加2番，即四倍。<br/>
龙七对：带杠的为龙七对，因带杠会在暗七对上的2番上再加一番。<br/>
清一色，所有牌型均为同一花色（包括碰杠牌），加2番。<br/>
幺九：本游戏不予支持。<br/>
下弯雨：牌局出现杠，引杠者输一倍底分给施杠者。<br/>
下直雨：牌局出现自摸杠，牌局未胡牌者扣一番。（下雨扣分暂不支持结算查叫返还处理）。<br/>
抢杠：对方已碰牌，再自摸进行自杠处理的时候，如果另外有一方出现胡此牌的玩家，则杠不成立，算作胡牌，并赔偿胡牌者2番。<br/>
暗杠：手上牌组有四张同样的牌缺未摆出进行杠操作，若胡牌在最终结算时仍要加1番。<br/>
杠上花：施杠者下牌之后会再摸一张牌，若此时正好胡牌，则加3番（自摸自带1番）。<br/>
杠上炮：施杠者出的下一张牌，出现点炮，施杠者赔胡牌者加2番。<br/>
天胡：庄家原手牌（还未出牌）状态则可胡牌，另外三家加2番。<br/>
海底：最后摸的一张牌出现自摸，加2番。<br/>
查叫：所有牌都摸完后，仍剩下2家及以上玩家未胡牌，无叫者则一律按照4倍底分赔偿有叫者，若都无叫则抵消赔偿。<br/>
杠牌加番：胡牌结算时，明杠和暗杠均按照一杠加1番计算。<br/>
                </div>
            },
            {
                key: 'guangan',
                name: '广安麻将',
                content: <div>
                    <center><h3>广安麻将胡牌规则</h3></center>
	最基本基本字数 				1颗<br/>
	卡张（46缺5）				+1颗<br/>
	边张（89缺7）				+1颗<br/>
	单调（钓将）				+1颗<br/>
	门清（没碰牌）				+1颗<br/>
		碰中发白算门清<br/>
	缺一门（同条缺万有中发白）	+1颗<br/>
	双缺（同条缺万没中发白）	+2颗<br/>
	自摸						+1颗<br/>
	姊妹对（556677）			+1颗<br/>
	混一色（万加中发白）		+8颗<br/>
	清一色（无中发白）			+14颗<br/>
	七对						+8颗<br/>
	明七对						+5颗<br/>
		PS:手牌5个对子 碰了六万 胡六万（要加算龙七对）<br/>
	龙七对（有中发白不另加）	+14颗<br/>
		PS：手牌五个对子+AAA胡A 算龙七对<br/>
	清七对（中发白另加）		+15颗<br/>
	清龙对						+20颗<br/>
	大对子						+7颗<br/>
	大对子金钩钓				+12颗<br/>
	纯清大对子					+20颗<br/>
		PS：AAA BBB CCC DDD E 胡E（全是同一种花色没有中发白）<br/>
	明杠（中发白除外）			+1颗<br/>
	明杠中发白					+2颗<br/>
	暗杠（中发白除外）			+2颗<br/>
	暗杠中发白					+3颗<br/>
	杠上花（炮）				+5颗<br/>
	抢杠						+5颗<br/>
	海底捞						+5颗<br/>
	杠上海底花（炮）			+10颗<br/>
	抢海底杠					+10颗<br/>
	小三元						+5颗<br/>
		PS：两个红中 三个白板、三个发财
	大三元（碰杠也算三个以上）	总分+7颗*2
		PS：中发白都有三个或以上碰杠也算
	杠上花也算自摸<br/>
	
	如果胡牌分数低于2颗（自摸情况下低于3颗）时不能抢杠，不能接杠上炮，海底炮，海底杠上炮<br/><br/>
	
	陪 PS:
		三个三万 三个四万 三个四条 三个五条 单吊二万
		算：大对子(7)+小飞机(1)+小飞机(1)+双缺(2)+自摸(1)+单吊(1)=13颗<br/><br/>
	
	大飞机：
		如你的牌型有555666777类似连着的筒条万（不管是否碰牌 只要能凑足类似连着的牌）
		在胡牌的基础上+7颗；（前提是555666777能单独提出来，不影响胡牌的情况）
		如果有5556666777888999则算两个大飞机拆分为 555666777 666777888<br/><br/>
	
	卡五星：
		吊五万、五同、五条或卡五万、五同、五条、在胡牌的基础上+1颗<br/><br/>
		
	一条龙：
		手上的牌能凑足123456789的相同花色、在胡牌的基础上+5颗（且抽出123456789后不影响胡牌）<br/><br/>
	
	花猪：
		最后手上还有未打完的必缺牌型、则赔双倍
                </div>
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
            }, 3000);
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
            { key: "selfWin", url: host + "/bigEvent/selfWin.png" },
            { key: "gangsh", url: host + "/bigEvent/gangsh.png" },
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
