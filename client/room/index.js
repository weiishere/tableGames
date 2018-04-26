import React, { Component } from 'react';
import { render } from 'react-dom';
import url from 'url';
import clone from 'clone';
import '../reset.less';
import './style2.less';
import { getQueryString, getColorName, concatCard } from '../util';
import loadImage from 'image-promise';
import QueueAnim from 'rc-queue-anim';


let isBegin = false;

document.querySelector('html').style.fontSize = `${document.body.clientWidth / 60}px`;
const ws = io('ws://192.168.31.222:3300/');

//console.log(window.orientation);//打印屏幕的默认方向  
window.addEventListener("orientationchange", function () {
    //console.log(window.orientation);
    document.querySelector('html').style.fontSize = `${document.body.clientWidth / 60}px`;
});
window.addEventListener("onsize", function () {
    //console.log(window.orientation);
    document.querySelector('html').style.fontSize = `${document.body.clientWidth / 60}px`;
});


class Table extends Component {
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
            roomId: getQueryString('roomId'),
            roomLog: [],
            room: null,
            game: null,
            activeCard: null,
            newState: true,
            isBegin: false,
            showRecore: false
            //countdown: 20
        }
        this.option = {
            gamerNumber: 2,
            colorType: 2,//表示两黄牌还是三黄牌
            mulriple: 1,//倍数
            score: 100,//底分
            gameTime: 4
        }
        this.gameInfoCloseHandle = this.gameInfoCloseHandle.bind(this);
        this.gameInfoOpenHandle = this.gameInfoOpenHandle.bind(this);
        this.readyCallback = this.readyCallback.bind(this);
    }
    componentDidMount() {
        const self = this;
        let once = true;
        ws.on('connect', function () {
            ws.emit('checkin', JSON.stringify({
                user: self.state.user,
                roomId: self.state.roomId,
                option: self.option
            }));
        });
        ws.on('message', function (msg) {
            const data = JSON.parse(msg);
            switch (data.type) {
                case 'roomData':
                    self.setState({ room: data.content });
                    break;
                case 'gameData':
                    if (data.content) {
                        if (data.content.isOver) {
                            self.setState({ game: data.content, showRecore: true });
                        } else {
                            self.setState({ game: data.content });
                        }

                        // self.setState({ countdown: 20 });
                        // let timer = window.setInterval(() => {
                        //     if (self.state.countdown === 0) {
                        //         window.clearInterval(timer);
                        //     }else{
                        //         self.setState({ countdown: --self.state.countdown });
                        //     }
                        // }, 1000);
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
                    history.back();
                    break;
            }
            console.log(data.content);
        });
        const timerforBegin = window.setInterval(() => {
            if (isBegin === true) {
                window.clearInterval(timerforBegin);
                this.setState({ isBegin: true });
            }
        }, 50);
    }
    gameInfoCloseHandle() {
        if (this.state.game.isOver) {
            //关闭连接
            ws.emit('disconnect');
        }
        this.setState({ showRecore: false });
    }
    gameInfoOpenHandle() {
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
                {me && <Gamer_mine user={me} room={this.state.room} userState={meGameState} lastOutCardKey={this.state.game && this.state.game.lastShowCard ? this.state.game.lastShowCard.key : ''} readyCallback={this.readyCallback} />}
                {rightGamer && <Gamer_right user={rightGamer} room={this.state.room} userState={rightGameState} lastOutCardKey={this.state.game && this.state.game.lastShowCard ? this.state.game.lastShowCard.key : ''} />}
                {leftGamer && <Gamer_left user={leftGamer} room={this.state.room} userState={leftGameState} lastOutCardKey={this.state.game && this.state.game.lastShowCard ? this.state.game.lastShowCard.key : ''} />}
                {topGamer && <Gamer_top user={topGamer} room={this.state.room} userState={topGameState} lastOutCardKey={this.state.game && this.state.game.lastShowCard ? this.state.game.lastShowCard.key : ''} />}
                {this.state.game && <div className='gameInfoBar'>
                    <span className='remain'>剩余<b>{this.state.game.remainCardNumber}</b>张&nbsp;&nbsp;第{this.state.room.allTime - this.state.room.gameTime}/{this.state.room.allTime}局</span>
                    <button onClick={this.gameInfoOpenHandle}></button>
                </div>}
                {this.state.game && <div className='tableCenter'>
                    <Countdown time={20} />
                    {/* <div className='center'>{this.state.countdown}</div> */}
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
            </div></QueueAnim>
    }
}
class Countdown extends Component {
    constructor(props) {
        super(props);
        this.state = {
            countdown: 20
        }
        this.timer = undefined;
    }
    componentWillUnmount(){
        window.clearInterval(this.timer);
    }
    componentWillReceiveProps() {
        this.setState({ countdown: this.props.time });
        if (this.timer) { return; }
        this.timer = window.setInterval(() => {
            if (this.state.countdown === 0) {
                window.clearInterval(this.timer);
            } else {
                this.setState({ countdown: --this.state.countdown });
            }
        }, 1000);
    }
    render() {
        return <div className='center'>{this.state.countdown}</div>
    }
}
// class TableCenter extends Component {
//     constructor(props) {
//         super(props);
//         this.state = {
//             countdown: 20
//         }
//     }
//     render() {
//         const meGameState = this.props.game ? this.props.game.gameState['user_' + me.uid] : null;
//         const rightGameState = this.props.game ? this.props.game.gameState['user_' + rightGamer.uid] : null;
//         const leftGameState = this.props.game ? this.props.game.gameState['user_' + leftGamer.uid] : null;
//         const topGameState = this.props.game ? this.props.game.gameState['user_' + topGamer.uid] : null;
//         return this.props.game && <div className='tableCenter'>
//             <div className='center'>{this.state.countdown}</div>
//             {meGameState && <div className={`${meGameState.catcher && 'bottom'}`}></div>}
//             {rightGameState && <div className={`${rightGameState.catcher && 'right'}`}></div>}
//             {leftGameState && <div className={`${leftGameState.catcher && 'left'}`}></div>}
//             {topGameState && <div className={`${topGameState.catcher && 'top'}`}></div>}
//         </div>

//     }
// }
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
        return <div className={`userDock ${this.props.class_name}`}>
            <img src='/images/games/majiang/head.jpg' />
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
        this.isLack = false;
        this.addConcatCard = [];
        this.ready = this.ready.bind(this);
        this.clickHandle = this.clickHandle.bind(this);
        this.showCard = this.showCard.bind(this);
        this.chooseColor = this.chooseColor.bind(this);
    }
    ready() {
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
        this.setState({ buttonVisible: false, activeCard: nextProps.userState && nextProps.userState.fatchCard || {} });
    }
    showCard() {
        //const _concatCard = concatCard(this.props.userState);
        const _isLack = this.addConcatCard.filter(card => card.color === this.props.userState.colorLack).length === 0 ? true : false;
        const _showCard = this.addConcatCard.find(card => card.key === this.state.activeCard.key);

        if (!this.props.userState.catcher || (this.props.userState.colorLack !== _showCard.color && !_isLack)) {
            this.setState({ activeCard: {} });
            return false;
        }
        //必须在打缺了的情况下，或者打的缺花色的牌，才通过
        if (_showCard.color === this.props.userState.colorLack || this.isLack) {
            ws.emit('showCard', JSON.stringify({
                roomId: this.props.room.roomId,
                uid: this.props.user.uid,
                cardKey: this.state.activeCard.key
            }));
            this.setState({ activeCard: {} });
        }
    }
    actionHandler(type) {
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
                //this.showCard();
                this.setState({ activeCard: {} });
            } else {
                this.setState({ activeCard: card });
            }
        }
    }
    chooseColor(color) {
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
                    <Card activeKey={this.state.activeCard.key} clickHandle={this.clickHandle} key='fetchCard' type='mine_fetch stress' card={this.props.userState.fatchCard}></Card>
                </div>}
            </QueueAnim>}
            {this.props.userState && <QueueAnim delay={200} duration={500} type={['bottom']} className='outCardListWrap'>
                {this.props.userState.outCards.map(card =>
                    <div style={{ display: 'inline-block' }} key={`out_${card.key}`}><Card type={`mine_main_out ${this.props.lastOutCardKey === card.key ? 'mark' : ''}`} card={card}></Card></div>)
                }
            </QueueAnim>}
            {!this.state.buttonVisible && <QueueAnim className='operateWrap' duration={300} animConfig={[
                { opacity: [1, 0], scale: [(1, 1), (0.8, 0.8)] }
            ]}>
                {/* <QueueAnim delay={0} duration={300} animConfig={[
                    { opacity: [1, 0], scale: [(1, 1), (0.8, 0.8)] }
                ]}> */}
                {this.props.user.state === 'wait' && ready}
                {this.props.userState && !this.props.userState.colorLack && lackColorChoose}
                {this.props.user.state !== 'wait' && this.props.userState && this.props.userState.catcher && this.props.userState.actionCode.length === 0 && <span key='showCard'>{btu_showCard}</span>}
                {
                    //这里可能会不显示操作面板（如果是碰，但是又有玩家要胡牌）
                    this.props.userState && this.props.userState.actionCode.map(action => {
                        if (action === 'meet' && !this.props.userState.isPause) return btu_meet;
                        if (action === 'fullMeet' && !this.props.userState.isPause) return btu_fullMeet;
                        if (action === 'winning') return btu_win;
                    })
                }
                {this.props.userState && !this.props.userState.isPause && this.props.userState.actionCode.length !== 0 && btu_pass}
                {/* </QueueAnim> */}
            </QueueAnim>}
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
                    let result = [];
                    for (let i = 0; i < +this.props.userState.cards; i++) {
                        result.push(<Card key={i} type='side_gamer_main'></Card>)
                    }
                    return result;
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
                    let result = [];
                    for (let i = 0; i < +this.props.userState.cards; i++) {
                        result.push(<Card key={i} type='face_gamer_main'></Card>)
                    }
                    return result;
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
                    let result = [];
                    for (let i = 0; i < +this.props.userState.cards; i++) {
                        result.push(<Card key={i} type='side_gamer_main'></Card>)
                    }
                    return result;
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
                            <div>
                                <header>
                                    <img src={`${gamer.avatar}`} />
                                    <span>{gamer.name}</span>
                                </header>
                                <ul className='list'>
                                    {
                                        this.props.room.recode.map((item, _index) => <li key={`li_${_index}`}>第{_index + 1}局：{item.find(user => user.uid === gamer.uid).point < 0 ? '' : '+'}{item.find(user => user.uid === gamer.uid).point}</li>)
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
                    {this.props.room.isOver && <div className='overWeak'>{this.props.room.allTime}局游戏已全部结束，休息一下，等你来战！</div>}
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
        this.imgList = [
            { key: "b", url: "/images/games/majiang2/b.png" },
            { key: "bg_1", url: "/images/games/majiang2/bg_1.jpg" },
            { key: "bg_default", url: "/images/games/majiang2/bg_default.jpg" },
            { key: "center", url: "/images/games/majiang2/center.png" },
            { key: "center_bottom", url: "/images/games/majiang2/center_bottom.png" },
            { key: "center_left", url: "/images/games/majiang2/center_left.png" },
            { key: "center_right", url: "/images/games/majiang2/center_right.png" },
            { key: "center_top", url: "/images/games/majiang2/center_top.png" },
            { key: "chooseB", url: "/images/games/majiang2/chooseB.png" },
            { key: "chooseT", url: "/images/games/majiang2/chooseT.png" },
            { key: "chooseW", url: "/images/games/majiang2/chooseW.png" },
            { key: "endTitle", url: "/images/games/majiang2/endTitle.png" },
            { key: "faceCard", url: "/images/games/majiang2/faceCard.png" },
            { key: "fullmeet", url: "/images/games/majiang2/fullmeet.png" },
            { key: "mainCard", url: "/images/games/majiang2/mainCard.png" },
            { key: "mainCard_group", url: "/images/games/majiang2/mainCard_group.png" },
            { key: "meet", url: "/images/games/majiang2/meet.png" },
            { key: "pass", url: "/images/games/majiang2/pass.png" },
            { key: "ready", url: "/images/games/majiang2/ready.png" },
            { key: "showCard", url: "/images/games/majiang2/showCard.png" },
            { key: "sideCard", url: "/images/games/majiang2/sideCard.png" },
            { key: "sideCard2", url: "/images/games/majiang2/sideCard2.png" },
            { key: "t", url: "/images/games/majiang2/t.png" },
            { key: "w", url: "/images/games/majiang2/w.png" },
            { key: "win", url: "/images/games/majiang2/win.png" },
            { key: "winner", url: "/images/games/majiang2/winner.png" },
            { key: "remain", url: "/images/games/majiang2/remain.png" },
            { key: "record", url: "/images/games/majiang2/record.png" },
            { key: "close_btu", url: "/images/games/majiang2/close_btu.png" },
            { key: "msg", url: "/images/games/majiang2/msg.png" }
        ];
        const cardColor = ['b', 't', 'w']; let cardArr = [];
        for (let i = 1; i <= 9; i++) {
            cardArr = cardArr.concat(cardColor.map(color => {
                return { key: color + i, url: "/images/games/majiang2/cards/" + (color + i) + ".png" };
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
//     <QueueAnim delay={300} style={{height:'100%'}} className="queue-simple">
//         <Table key='a' />
//     </QueueAnim>,
//     document.getElementById('layout')
// )

