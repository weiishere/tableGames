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
//import './test';
//import wechatConfig from '../wxConfig';
const theGamerNumber = 2;
const axios = require('axios');
String.prototype.trim = function () {
    return this.replace(/(^\s*)|(\s*$)/g, '');
};
//const Wechat = require('wechat-jssdk');
//const wx = new Wechat(wechatConfig);

let userInfo = {
    userid: getQueryString('uid'),
    nickname: getQueryString('name') || 'huangwei',
    headimgurl: '/images/games/majiang/head.jpg'
};
let isBegin = false;
let newRecore = false;
document.querySelector('html').style.fontSize = `${document.body.clientWidth / 60}px`;
window.addEventListener("onorientationchange" in window ? "orientationchange" : "resize", function () {
    window.setTimeout(function () {
        document.querySelector('html').style.fontSize = `${document.body.clientWidth / 60}px`;
    }, 1000);
}, false);
let ws = process.env.NODE_ENV === 'development' ? io('ws://192.168.31.222/') : io('ws://220.167.101.116:3300');
//const ws = io('ws://220.167.101.116:3300');

//console.log(window.orientation);//打印屏幕的默认方向  
window.addEventListener("orientationchange", function () {
    //console.log(window.orientation);
    document.querySelector('html').style.fontSize = `${document.body.clientWidth / 60}px`;
});
window.addEventListener("onsize", function () {
    //console.log(window.orientation);
    document.querySelector('html').style.fontSize = `${document.body.clientWidth / 60}px`;
});


if (process.env.NODE_ENV !== 'development') {
    const userInfoCookie = Cookies.get('wxUserInfo');
    if (!userInfoCookie) {
        location.href = '/auth?target=' + escape('room?roomId=' + getQueryString('roomId'));
    } else {
        console.log(JSON.parse(userInfoCookie));
        userInfo = JSON.parse(userInfoCookie);
    }
}


class Table extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: {
                uid: userInfo.userid,//getQueryString('uid'),
                name: userInfo.nickname,//getQueryString('name'),
                //avatar: 'https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=1736960767,2920122566&fm=27&gp=0.jpg',
                avatar: userInfo.headimgurl,//'/images/games/majiang/head.jpg',
                keepVertical: false,
                state: 'wait',
            },
            //roomId: getQueryString('roomId'),
            roomLog: [],
            room: null,
            game: null,
            activeCard: null,
            newState: true,
            isBegin: false,
            showRecore: false,
            isFristLoad: true,
            isConnectting: false,
            option: {}
        }
        // this.option = {
        //     gamerNumber: 4,
        //     colorType: 3,//表示两黄牌还是三黄牌
        //     mulriple: 1,//倍数
        //     score: 0,//底分
        //     gameTime: 4,

        // }
        this.isFristLoad = true;
        this.countdown = 60;
        this.ruleName = '';
        this.gameInit = this.gameInit.bind(this);
        this.gameInfoCloseHandle = this.gameInfoCloseHandle.bind(this);
        this.gameInfoOpenHandle = this.gameInfoOpenHandle.bind(this);
        this.readyCallback = this.readyCallback.bind(this);
        this.showCardAuto = this.showCardAuto.bind(this);
        //this.heartBeat = this.heartBeat.bind(this);
        this.lastData = { isOver: false };
    }
    // heartBeat({ roomId, uid }) {
    //     //心跳
    //     window.setInterval(() => {
    //         ws.emit('heartBeat', JSON.stringify({ roomId, uid }));
    //     }, 10000);
    // }
    componentDidMount() {
        //验证roomId是否在内存中，如果有的话就加入，若没有就去sqlite中去找，如果找到了，房间信息中的uid与玩家uid一至就建房，如果不一致就报错（房主还未激活），如果sqlite也没找到就报房间号无效
        const self = this;
        var reg = /^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/;
        //var r = getQueryString('roomId').match(reg);
        if (!reg.test(getQueryString('roomId'))) {
            alert('对不起，房间号不合法!');
            return;
        }
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

    }
    gameInit(room) {
        const self = this;
        let once = true;
        const roomOption = JSON.parse(room.jsonData);
        //this.countdown = process.env.NODE_ENV === 'development' ? 9999 : roomOption.countdown;
        this.ruleName = roomOption.ruleName;
        //开发测试的时候这里可以对游戏做临时配置
        const __option = {
            gamerNumber: theGamerNumber,
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
                        self.setState({ showMsgPanel: data.content.state === 'wait' ? true : false });
                    }
                    break;
                case 'gameData':
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
                case 'errorInfo':
                    alert(data.content);
                    //history.back();
                    break;
            }
            process.env.NODE_ENV === 'development' && console.log(data.content);
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
            if (isBegin === true) {
                window.clearInterval(timerforBegin);
                this.setState({ isBegin: true });
            }
        }, 50);
    }
    gameInfoCloseHandle() {
        newRecore = false;
        if (this.state.room.state === 'end') {
            //关闭连接
            //ws.emit('disconnect');
        }
        this.setState({ showRecore: false });
    }
    gameInfoOpenHandle() {
        newRecore = false;
        this.setState({ showRecore: true });
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
    render() {
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
        return !this.state.isBegin ? <ImgLoader /> : <QueueAnim delay={300} duration={800} animConfig={[
            { opacity: [1, 0], scale: [(1, 1), (0.8, 0.8)] }
        ]} style={{ height: '100%' }}><div key='main' className={`MainTable ${isAllcolorLack}`}>
                <div className='ruleNameBar'>{this.ruleName},{this.state.option.colorType === 2 ? '两' : '三'}门牌,{this.state.option.mulriple}倍</div>
                {me && <Gamer_mine user={me} game={this.state.game} room={this.state.room} userState={meGameState} lastOutCardKey={this.state.game && this.state.game.lastShowCard ? this.state.game.lastShowCard.key : ''} readyCallback={this.readyCallback} />}
                {rightGamer && <Gamer_right user={rightGamer} room={this.state.room} userState={rightGameState} lastOutCardKey={this.state.game && this.state.game.lastShowCard ? this.state.game.lastShowCard.key : ''} />}
                {leftGamer && <Gamer_left user={leftGamer} room={this.state.room} userState={leftGameState} lastOutCardKey={this.state.game && this.state.game.lastShowCard ? this.state.game.lastShowCard.key : ''} />}
                {topGamer && <Gamer_top user={topGamer} room={this.state.room} userState={topGameState} lastOutCardKey={this.state.game && this.state.game.lastShowCard ? this.state.game.lastShowCard.key : ''} />}
                <div className='gameInfoBar'>
                    {this.state.game && <span className='remain'>剩余<b>{this.state.game.remainCardNumber}</b>张&nbsp;&nbsp;第{this.state.room.allTime - this.state.room.gameTime}/{this.state.room.allTime}局</span>}
                    <button className='record' onClick={this.gameInfoOpenHandle}></button>
                    <button className='msg' onClick={() => { this.setState({ showMsgPanel: !this.state.showMsgPanel }); }}></button>
                </div>
                {this.state.game && <div className='tableCenter'>
                    <Countdown
                        time={this.state.game.remainTime}
                        roomState={this.state.room.state}
                        isOver={this.state.game.isOver}
                    //timeOverHander={this.showCardAuto} 
                    />
                    {meGameState && <div className={`${meGameState.catcher && 'bottom'}`}></div>}
                    {rightGameState && <div className={`${rightGameState.catcher && 'right'}`}></div>}
                    {leftGameState && <div className={`${leftGameState.catcher && 'left'}`}></div>}
                    {topGameState && <div className={`${topGameState.catcher && 'top'}`}></div>}
                </div>}
                <QueueAnim delay={100} duration={400} animConfig={[
                    { opacity: [1, 0], scale: [(1, 1), (0.8, 0.8)] }
                ]}>
                    {this.state.showRecore && <GameInfo key='infoPanel' closeHandle={this.gameInfoCloseHandle} user={me} room={this.lastData.room || this.state.room} isOver={this.state.game && this.state.game.isOver} />}
                </QueueAnim>
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
                    为了更好的游戏体验，请打开手机的允许屏幕旋转开关，Android用户还需在微信中进行设置：我-设置-通用-开启横屏模式
                    <br /><br />
                    <a href='javascript:;' onClick={() => {
                        this.setState({ keepVertical: true })
                    }}>坚持竖屏</a>
                </span>
            </div>}
            {
                this.state.isConnectting && <QueueAnim className='importantWeak'><span>网络重连中...</span></QueueAnim>
            }
        </QueueAnim>
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
        this.getTotal = this.getTotal.bind(this);
    }
    getTotal() {
        let total = 0;
        this.props.room.recode.map(item => total += item.find(user => this.props.uid === user.uid).point);
        return (total > 0 ? '+' : '') + total;
    }
    render() {
        return <div className={`userDock ${this.props.class_name} ${this.props.userState && this.props.userState.isWin ? 'winner' : ''}`}>
            <img src={this.props.avatar} />
            <div className='nameWrap'>{this.props.name}</div>
            {/* <span className='colorLack'>{getColorName(this.props.colorLack || {})}</span> */}
            <div className='score'>{this.getTotal()}</div>
            {this.props.state === 'ready' && this.props.room.state === 'wait' && <div className="ready_ok"></div>}
            {this.props.userState && this.props.userState.colorLack ? <span className='colorLack'><img src={`/images/games/majiang2/${this.props.userState.colorLack}.png`} /></span> : ''}
        </div>
    }
}
class Gamer_mine extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeCard: {},
            buttonVisible: false,
            fmChooseCardKey: [] //用于多杠的情况
        }
        this.cardHandler = false;
        this.isLack = false;
        this.addConcatCard = [];
        this.ready = this.ready.bind(this);
        this.clickHandle = this.clickHandle.bind(this);
        this.showCard = this.showCard.bind(this);
        this.chooseColor = this.chooseColor.bind(this);
    }
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
    }
    componentWillReceiveProps(nextProps) {
        this.cardHandler = false;
        this.setState({
            buttonVisible: false,//nextProps.userState.actionCode.length === 0 ? true : false,
            activeCard: nextProps.userState && nextProps.userState.fatchCard || {}
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
    showCard() {
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
            this.setState({ activeCard: {} });
            this.cardHandler = false;
            ws.emit('showCard', JSON.stringify({
                roomId: this.props.room.roomId,
                uid: this.props.user.uid,
                cardKey: this.state.activeCard.key
            }));
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
                //如果有操作选项在，则禁用双击打牌，不然有点麻烦
                if (this.props.userState.actionCode.length !== 0) { return; }
                this.showCard();
                if (this.props.userState.catcher) {
                    this.setState({ activeCard: card });
                }
            } else {
                this.setState({ activeCard: card });
            }
        }
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
        if (this.props.userState) {
            //this.addConcatCard = concatCard(this.props.userState);
            this.isLack = concatCard(this.props.userState).filter(card => card.color === this.props.userState.colorLack).length === 0 ? true : false;
        }
        const ready = <div key='ready' onClick={this.ready} className='btu ready'></div>
        const btu_showCard = <div key='showCard' onClick={this.showCard} className={`btu showCard ${this.state.activeCard.key && 'active'}`}></div>
        const btu_meet = <div key='meet' onClick={() => this.actionHandler('meet')} className='btu meet'></div>;//碰
        const btu_fullMeet = <div key='fullMeet' onClick={() => this.actionHandler('fullMeet')} className='btu fullmeet'></div>;//杠
        const btu_win = <div key='winning' onClick={() => this.actionHandler('winning')} className='btu win'></div>;//胡牌
        const btu_pass = <div key='pass' onClick={() => this.actionHandler('pass')} className='btu pass' ></div>;//过
        const lackColorChoose = <div key='ColorChoose'>
            <div key='b' className='btu chooseColor chooseB' onClick={() => this.chooseColor('b')}></div>
            <div key='t' className='btu chooseColor chooseT' onClick={() => this.chooseColor('t')}></div>
            <div key='w' className='btu chooseColor chooseW' onClick={() => this.chooseColor('w')}></div>
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
                {this.props.userState.cards.map(card =>
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
                    <Card activeKey={this.state.activeCard.key} clickHandle={this.clickHandle} key='fetchCard'
                        type={`mine_main ${!this.isLack && (this.props.userState.colorLack !== this.props.userState.fatchCard.color || (this.state.fmChooseCardKey.length > 1 && this.state.fmChooseCardKey.indexOf(card.key) === -1)) ? 'gray' : ''} stress`}
                        card={this.props.userState.fatchCard}></Card>
                </div>}
                <div className='winDesc'>{this.props.userState.winDesc}</div>
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
                    {this.props.user.state !== 'wait' && this.props.userState && this.props.userState.catcher && this.props.userState.actionCode.length === 0 && this.state.activeCard.key && btu_showCard}
                    {
                        //这里可能会不显示操作面板（如果是碰，但是又有玩家要胡牌）
                        this.props.userState && !this.props.game.isOver && this.props.userState.actionCode.map(action => {
                            if (action === 'meet' && !this.props.userState.isPause) return btu_meet;
                            if (action === 'fullMeet' && !this.props.userState.isPause) return btu_fullMeet;
                            if (action === 'winning') return btu_win;
                        })
                    }
                    {this.props.userState && !this.props.userState.isPause && this.props.userState.actionCode.length !== 0 && btu_pass}
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
    render() {
        let card = <span onClick={(e) => { this.cardClick(e, this.props.card) }} className={`card card_${this.props.type} ${this.props.card && this.props.card.key === this.props.activeKey && 'active'}`}>
            {this.props.card && <img src={`/images/games/majiang2/cards/${this.props.card.color}${this.props.card.number}.png`} />}
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
    }
    // shouldComponentUpdate(nextProps, nextState) {
    //     if (this.props.game.isOver) {
    //         //如果是结束的时候，则不更新
    //         return false;
    //     } else {
    //         return true
    //     }
    // }
    getTotal(uid) {
        let total = 0;
        this.props.room.recode.map(item => total += item.find(user => uid === user.uid).point);
        return (total > 0 ? '+' : '') + total;
    }
    render() {
        return <div className='mask'>
            <div className='gameInfoPanel'>
                {this.props.isOver && <header></header>}
                <div className='contentWrap'>
                    {
                        this.props.room.gamers.map((gamer, index) => <div key={index} className='content'>
                            <div className={gamer.uid === this.props.user.uid ? `self` : ''}>
                                <header>
                                    <img src={`${gamer.avatar}`} />
                                    <span>{gamer.name}</span>
                                </header>
                                <ul className='list'>
                                    {
                                        this.props.room.recode.map((item, _index) =>
                                            <li key={`li_${_index}`}>
                                                第{_index + 1}局：{item.find(user => user.uid === gamer.uid).point < 0 ? '' : '+'}
                                                {item.find(user => user.uid === gamer.uid).point}
                                                <div><i>{item.find(user => user.uid === gamer.uid).winDesc || '---'}</i></div>
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
                </footer>
            </div>
        </div>
    }
}
class MsgPanel extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            msgContent: '',
            miniMsgPanel: false,
            miniMsgPanelList: []
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
        this.logCount = nextProps.roomLog.length;
    }
    componentDidUpdate() {
        $('.mainList').scrollTop($('.mainList').height());
    }
    componentDidMount() {
        const self = this;
        $('#selection').delegate('li', 'click', function () {
            self.props.sendMsg(this.innerText);
            self.setState({ visible: false });
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
                <div className={`${this.state.visible ? '' : 'hide'}`}>
                    <ul id='selection'>
                        <li>快点儿吧，等到我花都结果啦！</li>
                        <li>麻神驾到，还不尖叫！！</li>
                        <li>输遍天下无敌手的我居然赢了你</li>
                        <li>乖乖，麻将国粹无处不在！</li>
                        <li>搏一搏，单车变摩托</li>
                        <li>麻匪们，再来两局！</li>
                    </ul>
                </div>
            </header>
            <div className='mainList'>
                <ul>
                    {this.props.roomLog.map((log, index) => log.type === 'notified' ?
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

            { key: "desktop1", url: host + "/desktop1.jpg" },
            { key: "desktop2", url: host + "/desktop2.jpg" },
            { key: "desktop3", url: host + "/desktop3.jpg" },
            { key: "bg_1", url: host + "/bg_1.jpg" },
            { key: "bg_2", url: host + "/bg_2.jpg" },
            { key: "bg_default", url: host + "/bg_default.jpg" },
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
            { key: "msgBtu", url: host + "/msgBtu.png" }
        ];
        const cardColor = ['b', 't', 'w']; let cardArr = [];
        for (let i = 1; i <= 9; i++) {
            cardArr = cardArr.concat(cardColor.map(color => {
                return { key: color + i, url: host + "/cards/" + (color + i) + ".png" };
            }));
        }
        this.imgList = this.imgList.concat(cardArr);
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


render(
    <Table />,
    document.getElementById('layout')
)


