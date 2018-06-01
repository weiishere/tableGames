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
//import wechatConfig from '../wxConfig';
const axios = require('axios');
//const Wechat = require('wechat-jssdk');
//const wx = new Wechat(wechatConfig);

let userInfo = {
    userid: getQueryString('uid'),
    nickname: 'huangwei',
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
const ws = process.env.NODE_ENV === 'development' ? io('ws://127.20.10.9/') : io('ws://220.167.101.116:3300');
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
            option: {}
        }
        // this.option = {
        //     gamerNumber: 4,
        //     colorType: 3,//表示两黄牌还是三黄牌
        //     mulriple: 1,//倍数
        //     score: 0,//底分
        //     gameTime: 4,

        // }
        this.countdown = 60;
        this.ruleName = '';
        this.gameInit = this.gameInit.bind(this);
        this.gameInfoCloseHandle = this.gameInfoCloseHandle.bind(this);
        this.gameInfoOpenHandle = this.gameInfoOpenHandle.bind(this);
        this.readyCallback = this.readyCallback.bind(this);
        this.showCardAuto = this.showCardAuto.bind(this);
        this.heartBeat = this.heartBeat.bind(this);
    }
    heartBeat({ roomId, uid }) {
        //心跳
        window.setInterval(() => {
            ws.emit('heartBeat', JSON.stringify({ roomId, uid }));
        }, 10000);
    }
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
                    this.heartBeat({ roomId: room.roomId, uid: this.state.user.uid });
                    // self.gameInit({
                    //     roomId: '292f0a78-e304-48cc-9aea-4fd0a7341347',
                    //     jsonData: JSON.stringify({ countdown: 30, colorType: 3, mulriple: 1, gameTime: 4 })
                    // });
                }
            }
        });
        ws.on('connect', function () { });
    }
    gameInit(room) {
        const self = this;
        let once = true;
        const roomOption = JSON.parse(room.jsonData);
        this.countdown = process.env.NODE_ENV === 'development' ? 9999 : roomOption.countdown;
        this.ruleName = roomOption.ruleName;
        const __option = {
            gamerNumber: 3,
            rule: roomOption.rule,
            colorType: roomOption.colorType,//表示两黄牌还是三黄牌
            mulriple: roomOption.mulriple,//倍数
            gameTime: roomOption.gameTime
        }
        this.setState({
            option: __option
        })
        ws.emit('checkin', JSON.stringify({
            user: self.state.user,
            roomId: room.roomId,
            option: __option
        }));
        ws.on('message', function (msg) {
            const data = JSON.parse(msg);
            switch (data.type) {
                case 'roomData':
                    self.setState({ room: data.content });
                    break;
                case 'gameData':
                    if (data.content) {
                        newRecore = true;
                        if (data.content.isOver) {
                            self.setState({ game: data.content, showRecore: true });
                        } else {
                            self.setState({ game: data.content });
                        }
                    } else {
                        self.setState({ game: undefined });
                    }
                    break;
                case 'notified':
                    const log = self.state.roomLog;
                    log.push(data.content);
                    self.setState({ roomLog: log });
                    break;
                case 'errorInfo':
                    alert(data.content);
                    //history.back();
                    break;
            }
            process.env.NODE_ENV === 'development' && console.log(data.content);
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
            ws.emit('disconnect');
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
        this.setState({ game: null });
    }
    //玩家时间到，自动为其出牌
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
                {me && <Gamer_mine user={me} room={this.state.room} userState={meGameState} lastOutCardKey={this.state.game && this.state.game.lastShowCard ? this.state.game.lastShowCard.key : ''} readyCallback={this.readyCallback} />}
                {rightGamer && <Gamer_right user={rightGamer} room={this.state.room} userState={rightGameState} lastOutCardKey={this.state.game && this.state.game.lastShowCard ? this.state.game.lastShowCard.key : ''} />}
                {leftGamer && <Gamer_left user={leftGamer} room={this.state.room} userState={leftGameState} lastOutCardKey={this.state.game && this.state.game.lastShowCard ? this.state.game.lastShowCard.key : ''} />}
                {topGamer && <Gamer_top user={topGamer} room={this.state.room} userState={topGameState} lastOutCardKey={this.state.game && this.state.game.lastShowCard ? this.state.game.lastShowCard.key : ''} />}
                {this.state.game && <div className='gameInfoBar'>
                    <span className='remain'>剩余<b>{this.state.game.remainCardNumber}</b>张&nbsp;&nbsp;第{this.state.room.allTime - this.state.room.gameTime}/{this.state.room.allTime}局</span>
                    <button onClick={this.gameInfoOpenHandle}></button>
                </div>}
                {this.state.game && <div className='tableCenter'>
                    <Countdown time={this.countdown} roomState={this.state.room.state} isOver={this.state.game.isOver} timeOverHander={this.showCardAuto} />
                    {meGameState && <div className={`${meGameState.catcher && 'bottom'}`}></div>}
                    {rightGameState && <div className={`${rightGameState.catcher && 'right'}`}></div>}
                    {leftGameState && <div className={`${leftGameState.catcher && 'left'}`}></div>}
                    {topGameState && <div className={`${topGameState.catcher && 'top'}`}></div>}
                </div>}
                <QueueAnim delay={100} duration={400} animConfig={[
                    { opacity: [1, 0], scale: [(1, 1), (0.8, 0.8)] }
                ]}>{this.state.game && this.state.showRecore &&
                    <GameInfo key='infoPanel' closeHandle={this.gameInfoCloseHandle} user={me} room={this.state.room} game={this.state.game} />}
                </QueueAnim>
            </div>
            <div className='orientationWeak'>
                <span>为了更好的游戏体验，请使用横屏模式，iPhone用户请直接允许系统横屏，Android用户微信请设置：横屏设置：我-设置-通用-开启横屏模式</span>
            </div>
        </QueueAnim>
    }
}
class Countdown extends Component {
    constructor(props) {
        super(props);
        this.state = {
            countdown: 20
        }
        this.isEnd = false;
        this.timer = undefined;
    }
    componentWillUnmount() {
        window.clearInterval(this.timer);
    }
    componentWillReceiveProps() {
        if (!newRecore) { return false; }
        if (this.props.isOver) {
            window.clearInterval(this.timer);
        } else {
            if (this.props.roomState === 'playing') {
                this.setState({ countdown: this.props.time }, () => {
                    window.clearInterval(this.timer);
                    this.timer = window.setInterval(() => {
                        if (this.state.countdown === 0) {
                            this.props.timeOverHander();
                            window.clearInterval(this.timer);
                        } else {
                            this.setState({ countdown: --this.state.countdown });
                        }
                    }, 1000);
                });
            } else {
                this.setState({ countdown: this.props.time });
                window.clearInterval(this.timer);
            }
        }
        //if (this.timer) { return; }
    }
    render() {
        return <div className='center'>{this.state.countdown}</div>
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
            buttonVisible: false
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
        this.setState({ buttonVisible: false, activeCard: nextProps.userState && nextProps.userState.fatchCard || {} });


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
        //const _concatCard = concatCard(this.props.userState);
        const _isLack = this.addConcatCard.filter(card => card.color === this.props.userState.colorLack).length === 0 ? true : false;
        const _showCard = this.addConcatCard.find(card => card.key === this.state.activeCard.key);

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
        if (type === 'fullMeet') {
            let allCard = concatCard(this.props.userState);
            let { resultType_1, resultType_2 } = getCardShowTime(allCard);
            if (resultType_2.four.length >= 2) {
                //需要选择杠哪张牌
                return;
            }
        }
        this.cardHandler = true;
        //点击了就马上隐藏按钮，免得再多生事端
        this.setState({ buttonVisible: true });
        ws.emit('action', JSON.stringify({
            roomId: this.props.room.roomId,
            uid: this.props.user.uid,
            actionType: type
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
        if (!this.isLack && card.color !== this.props.userState.colorLack) {
            //this.setState({ activeCard: {} });
        } else {
            if (card.key === this.state.activeCard.key) {
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
            this.addConcatCard = concatCard(this.props.userState);
            this.isLack = this.addConcatCard.filter(card => card.color === this.props.userState.colorLack).length === 0 ? true : false;
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
                    <div style={{ display: 'inline-block' }} key={`card_${card.key}`}><Card activeKey={this.state.activeCard.key} clickHandle={this.clickHandle} type={`mine_main ${!this.isLack && this.props.userState.colorLack !== card.color ? 'gray' : ''}`} card={card}></Card></div>)
                }

                {this.props.userState.fatchCard && <div key='fetchCard' className='fetchCard'>
                    <Card activeKey={this.state.activeCard.key} clickHandle={this.clickHandle} key='fetchCard' type={`mine_main ${!this.isLack && this.props.userState.colorLack !== this.props.userState.fatchCard.color ? 'gray' : ''} stress`} card={this.props.userState.fatchCard}></Card>
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
                        this.props.userState && this.props.userState.actionCode.map(action => {
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
    // ready() {
    //     const self = this;
    //     ws.emit('ready', JSON.stringify({
    //         user: self.props.user,
    //         roomId: this.props.room.roomId,
    //         state: 'ready'
    //     }));
    // }
    getTotal(uid) {
        let total = 0;
        this.props.room.recode.map(item => total += item.find(user => uid === user.uid).point);
        return (total > 0 ? '+' : '') + total;
    }
    render() {
        return <div className='mask'>
            <div className='gameInfoPanel'>
                <header></header>
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
                                                <div><i>-{item.find(user => user.uid === gamer.uid).winDesc}</i></div>
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

class ImgLoader extends Component {
    constructor(props) {
        super(props);
        this.state = { percent: 0 };
        this.loadedCount = 0;
        //const host = 'https://yefeng-test.oss-cn-beijing.aliyuncs.com/images/';
        const host = '/images/games/majiang2/';
        this.imgList = [
            { key: "b", url: host + "/b.png" },
            { key: "bg_1", url: host + "/bg_1.jpg" },
            { key: "bg_1", url: host + "/bg_2.jpg" },
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
            { key: "win", url: host + "/win.png" },
            { key: "winner", url: host + "/winner.png" },
            { key: "remain", url: host + "/remain.png" },
            { key: "record", url: host + "/record.png" },
            { key: "close_btu", url: host + "/close_btu.png" },
            { key: "msg", url: host + "/msg.png" }
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
        // render(
//     <QueueAnim delay={300} style={{ height: '100%' }} className="queue-simple">
//         <Table key='a' />
//     </QueueAnim>,
//     document.getElementById('layout')
// )

