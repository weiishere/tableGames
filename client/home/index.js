import React, { Component } from 'react';
import { render } from 'react-dom';
import { Card, WingBlank, WhiteSpace, List, InputItem, Popover, Picker, Modal, Icon, NavBar, Button, ActivityIndicator, Stepper } from 'antd-mobile';
import url from 'url';
import clone from 'clone';
import Cookies from "js-cookie";
import '../reset.less';
import './style.less';
import { getQueryString, getColorName, concatCard, getRedom } from '../util';
import $ from 'jquery';
const axios = require('axios');
const Item = Popover.Item;
let userInfo = {
    userid: getQueryString('uid'),
    nickname: 'huangwei',
    headimgurl: '/images/games/majiang/head.jpg'
};
if (process.env.NODE_ENV !== 'development') {
    const userInfoCookie = Cookies.get('wxUserInfo');
    if (!userInfoCookie) {
        location.href = '/auth?target=' + escape('room?roomId=' + getQueryString('roomId'));
    } else {
        console.log(JSON.parse(userInfoCookie));
        userInfo = JSON.parse(userInfoCookie);
    }
}

class LayOut extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isAllow: false,
            user: userInfo
        }
    }
    componentDidMount() {

        // axios.post('/api/login', {
        //     openId: openId
        // }).then(function (response) {
        //     if (!response.data) {
        //         //未注册
        //         axios.post('/api/reg', {
        //             openId: openId,
        //             username: uaerName
        //         }).then(function (response) {
        //             console.log(response);
        //         });
        //     } else {
        //         //已注册
        //     }
        // }).catch(function (error) {
        //     console.log(error);
        // });
        window.setTimeout(() => {
            this.setState({
                isAllow: true
            })
        }, 1000);
    }
    render() {
        return this.state.isAllow ? <NewRoom user={this.state.user} /> : <div className="toast-example">
            <ActivityIndicator
                toast
                text="请稍后..."
                animating={true}
            />
        </div>
    }
}
class NewRoom extends Component {
    constructor(props) {
        super(props);

        this.state = {
            roomCard: 0,
            roomId: 0,
            visible: false,
            modal_visible: false,
            roomInfo_visible: false,
            modal_title: '',
            modal_details: '',
            rule: ['chengdu'],
            ruleName: '成都麻将',
            mulriple: 1,
            colorType: [3],
            countdown: [20]
        }
        this.ruleData = [
            { value: 'chengdu', label: '成都麻将' },
            { value: 'guangan', label: '广安麻将' }
        ]
        this.checkinHandler = this.checkinHandler.bind(this);
    }
    checkinHandler() {
        axios.post('/api/checkin', {
            uid: this.props.user.userid,
            rule: this.state.rule[0],
            ruleName: this.state.ruleName,
            mulriple: this.state.mulriple,
            colorType: this.state.colorType[0],
            countdown: this.state.countdown[0]
        }).then((data) => {
            this.setState({
                roomInfo_visible: true,
                roomId: data.data
            });
        });
    }
    render() {

        return <div className='flex-container'>
            <div className="sub-title">
                <img src='/images/games/majiang2/roomCheckin.png' />
            </div>

            <WingBlank size="lg">
                <WhiteSpace size="lg" />
                <Card>
                    <Card.Header
                        title="房间配置"
                        thumb='/images/games/majiang2/roomCard.png'
                        extra={<span>checkin</span>}
                    />
                    <Card.Body>
                        <List>
                            <List.Item>
                                {/* <InputItem
                                    value={this.state.roomCard}
                                    maxLength={2}
                                    type='number'
                                    placeholder="一张房卡4局"
                                    onChange={v => this.setState({ roomCard: v })}
                                >使用房卡:</InputItem> */}
                                <span style={{ display: 'inline-block', width: '5.3rem', marginLeft: '1rem' }}>使用房卡</span>
                                <Stepper
                                    style={{ width: '7rem', marginLeft: '1rem' }}
                                    showNumber
                                    max={5}
                                    min={0}
                                    value={this.state.roomCard}
                                    onChange={v => this.setState({ roomCard: v })}
                                />
                                <div className='iconFloat'>
                                    <Icon type='ellipsis' onClick={() => {
                                        this.setState({
                                            modal_visible: true,
                                            modal_title: '房卡使用',
                                            modal_details: '你可用多张房卡，最多不能超过你所持的房卡数，一张房卡为4局，请合理配置'
                                        })
                                    }} />
                                </div>
                            </List.Item>
                            <List.Item>
                                <Picker data={this.ruleData} cols={1}
                                    value={this.state.rule}
                                    onChange={v => this.setState({
                                        rule: v,
                                        ruleName: this.ruleData.find(item => item.value === v[0]).label
                                    })}
                                    onOk={v => this.setState({
                                        rule: v,
                                        ruleName: this.ruleData.find(item => item.value === v[0]).label
                                    })}>
                                    <List.Item arrow="horizontal">规则</List.Item>
                                </Picker>
                                <div className='iconFloat'>
                                    <Icon type='ellipsis' onClick={() => {
                                        this.setState({
                                            modal_visible: true,
                                            modal_title: '规则配置',
                                            modal_details: '由于麻将游戏具有地域性的特点，系统根据不同的地域配置了规则组，更多的规则组会逐步添加，您也可以自定义规则'
                                        })
                                    }} />
                                </div>
                            </List.Item>
                            <List.Item>
                                {/* <InputItem
                                    value={this.state.mulriple}
                                    type='number'
                                    placeholder="虚拟分数的倍数"
                                    onChange={v => this.setState({ mulriple: v })}
                                >倍数:</InputItem> */}
                                <span style={{ display: 'inline-block', width: '5.3rem', marginLeft: '1rem' }}>倍数</span>
                                <Stepper
                                    style={{ width: '7rem', marginLeft: '1rem' }}
                                    showNumber
                                    max={10}
                                    min={1}
                                    value={this.state.mulriple}
                                    onChange={v => this.setState({ mulriple: v })}
                                />
                                <div className='iconFloat'>
                                    <Icon type='ellipsis' onClick={() => {
                                        this.setState({
                                            modal_visible: true,
                                            modal_title: '倍数',
                                            modal_details: '此为游戏正常结算规则的基础上乘以的倍数，初始的倍数为1倍，你可以为其设置其他的多倍数'
                                        })
                                    }} />
                                </div>
                            </List.Item>
                            <List.Item>
                                <Picker data={[
                                    { value: 3, label: '三门牌' },
                                    { value: 2, label: '两门牌' }
                                ]} cols={1}
                                    value={this.state.colorType}
                                    onChange={v => this.setState({ colorType: v })}
                                    onOk={v => this.setState({ colorType: v })}>
                                    <List.Item arrow="horizontal">门数选择</List.Item>
                                </Picker>
                                <div className='iconFloat'>
                                    <Icon type='ellipsis' onClick={() => {
                                        this.setState({
                                            modal_visible: true,
                                            modal_title: '门数选择',
                                            modal_details: '若是三门牌您需要打缺一门才能胡牌，两门牌只有两幅牌（默认缺少筒），您无须打缺，节奏体现的会更快'
                                        })
                                    }} />
                                </div>
                            </List.Item>
                            <List.Item>
                                <Picker data={[
                                    { value: 10, label: '10S' }, { value: 20, label: '20S' },
                                    { value: 30, label: '30S' }, { value: 40, label: '40S' },
                                    { value: 50, label: '50S' }, { value: 60, label: '60S' }
                                ]} cols={1}
                                    value={this.state.countdown}
                                    onChange={v => this.setState({ countdown: v })}
                                    onOk={v => this.setState({ countdown: v })}>
                                    <List.Item arrow="horizontal">时间限制(秒)</List.Item>
                                </Picker>
                                <div className='iconFloat'>
                                    <Icon type='ellipsis' onClick={() => {
                                        this.setState({
                                            modal_visible: true,
                                            modal_title: '出牌时间限制',
                                            modal_details: '规定玩家操作（出牌、碰、杠、胡）的最长时间，若玩家在规定时内未完成操作，系统将根据情况自动进行处理，请根据玩家反应及游戏水平做出合理配置'
                                        })
                                    }} />
                                </div>
                            </List.Item>
                            <List.Item>
                                <Button type="primary" onClick={this.checkinHandler}>确认建房</Button>
                            </List.Item>
                        </List>
                    </Card.Body>
                    <Card.Footer content="持有房卡：20" extra={<div>积分：5263</div>} />
                </Card>
                <WhiteSpace size="lg" />
            </WingBlank>
            <Modal
                visible={this.state.modal_visible}
                transparent
                maskClosable={true}
                title="操作说明"
                animationType='slide-down'
                footer={[{ text: '知道了', onPress: () => { this.setState({ modal_visible: false }) } }]}
            >
                <div style={{ textAlign: 'left' }}>{this.state.modal_details}</div>
            </Modal>
            <Modal
                visible={this.state.roomInfo_visible}
                transparent
                maskClosable={true}
                title="开房成功"
                animationType='slide-down'
                footer={[{ text: '跳转', onPress: () => { } }]}
            >
                <div style={{ textAlign: 'left' }}>
                    请点击<a href={`http://www.fanstongs.com/room?roomId=${this.state.roomId}`}>跳转</a>至游戏房间，发送此链接邀请伙伴加入~~
                <div>http://fanstongs.com/room?roomId={this.state.roomId}</div>
                </div>
            </Modal>
        </div>
    }
}

render(
    <LayOut />,
    document.getElementById('layout')
)