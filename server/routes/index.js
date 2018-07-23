

const apiRoute = require('./api');
const OAuth = require('node-wechat-oauth');
const getToken = require('../util/token');
const cookie = require('cookie');
const axios = require('axios');
const request = require('request');
//const sha1 = require('../util/sha1');
const sha1 = require('js-sha1');
const appid = 'wxf6a4e87064c3fbd2';
const secret = '7fb75eea66988061a1ed9578e7d8fef4';
let tokens = {};
const oauth = new OAuth(appid, secret);
const writeLog = require('../util/errorLog');
const apiUrl = 'http://220.167.101.116:8080';
var http = require('http');
var url = require('url');
const qs = require('qs');

let tokenTimer;
global.access_token = '';
// const oauth = new OAuth(appid, secret, 
//     (openid) => {
//     //用于获取token的方法 异步操作需返回Promise
//     // const txt = await fs.readFile(`${openid}:access_token.txt`, 'utf8');
//     // return JSON.parse(txt);
//     return tokens[openid];
// }, (openid, token) => {
//     //用于保存token的方法 异步操作需返回Promise
//     await(() => {
//         tokens[openid] = token;
//     })();
//     //await fs.writeFile(`${openid}:access_token.txt`, JSON.stringify(token));
// });
const getAccess_token = (done) => {
    try {
        var url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + appid + '&secret=' + secret;
        request.get(url, function (err, response, body) {
            console.log((new Date()).toLocaleString() + '：get access_token:' + body);
            var token = JSON.parse(body);
            global.access_token = token.access_token;
            done && done();
        });
    } catch (error) {
        writeLog('getAccess_token', error);
    }

}


module.exports = (app) => {
    apiRoute(app);
    app.get('/checkIn/', function (req, res, next) {
        res.render('index.ejs', {
            title: '创建房间-掌派桌游',
            scripts: `<script src='http://apps.bdimg.com/libs/fastclick/1.0.0/fastclick.min.js'></script>
            <script src='/dist/home.bundle.js'></script>`
        });
    });
    app.get('/room/', function (req, res, next) {
        res.render('room.ejs', {
            title: '房间-掌派桌游',
            scripts: `<script src='http://apps.bdimg.com/libs/fastclick/1.0.0/fastclick.min.js'></script>
            <script src='http://res.wx.qq.com/open/js/jweixin-1.2.0.js'></script>
            <script src='/frame/socket.io-1.4.5.js'></script>
            <script src='/dist/room.bundle.js?dist=043003'></script>`
        });
    });
    app.get('/auth/', function (req, res, next) {
        const { target } = req.query;
        // oauth = new OAuth(appid, secret, async (openid) => {
        //     //用于获取token的方法 异步操作需返回Promise
        //     // const txt = await fs.readFile(`${openid}:access_token.txt`, 'utf8');
        //     // return JSON.parse(txt); 
        // }, async (openid, token) => {
        //     //用于保存token的方法 异步操作需返回Promise
        //     //await fs.writeFile(`${openid}:access_token.txt`, JSON.stringify(token));
        // });
        const url = oauth.getAuthorizeURL('http://www.fanstongs.com/auth_response', target, 'snsapi_userinfo');
        res.redirect(url);
    });
    app.get('/auth_response/', async function (req, res, next) {
        const { code, state } = req.query;
        const result = await oauth.getAccessToken(code);
        //console.log(result);
        const accessToken = result.data.access_token;
        const openid = result.data.openid;
        //console.log(accessToken + '---' + openid);
        //这一步先根据openId判断数据库有没有数据，有数据直接获取，没有数据写入之后再操作
        let userInfo = await oauth.getUser(openid);
        //console.log(userInfo);
        //let _url = `http://manage.fanstongs.com/api/login?openid=${userInfo.openid}&token=${getToken()}&username=${userInfo.nickname}&headUrl=${userInfo.headimgurl}`
        let _url = `http://manage.fanstongs.com/api/login`;
        //console.log(encodeURI(_url));
        const data = {
            openid: userInfo.openid,
            username: userInfo.nickname,
            headUrl: userInfo.headimgurl,
            token: getToken()
        }
        axios.post(_url, qs.stringify(data))
            .then((response) => {
                if (!response.data.userid) {
                    writeLog('login api then', response);
                }
                userInfo['userid'] = response.data.userid;
                userInfo['score'] = response.data.score;
                userInfo['roomcard'] = response.data.roomcard;
                userInfo.nickname = decodeURI(userInfo.nickname);
                res.setHeader('Set-Cookie', cookie.serialize('wxUserInfo', JSON.stringify(userInfo))
                    // , {
                    //     maxAge: 60 * 60 * 24 * 7 // 1 week
                    // }
                );
                res.redirect(`/${state}`);
            }).catch(function (error) {
                writeLog('login api', error);
            });



        // oauth.getAccessToken(code).then((accessToken) => {
        //     console.log('accessToken:' + accessToken);
        //     const userInfo = oauth.getUserByToken(accessToken.data.openid, accessToken.data.access_token);
        //     console.log("userInfo:" + userInfo);
        //     console.log("state:" + state);
        //     res.redirect(`http://www.fanstongs.com/${state}?openId=${userInfo.openid}&nickName=${userInfo.nickname}&headimgurl=${userInfo.headimgurl}`);
        // }, () => {
        //     console.log('getAccessToken error');
        // })
    });
    app.get('/playing', function (req, res, next) {
        const { uid } = req.query;
        let rooms = global.allRooms || [];
        const roomsLength = rooms.length;
        let resultRooms = null;
        for (let i = 0; i < roomsLength; i++) {
            const gamers = rooms[i].gamers;
            const gamersLength = gamers.length;
            // console.log(gamers);
            // console.log(uid);
            for (let j = 0; j < gamersLength; j++) {
                if (gamers[j].uid + '' === uid + '') {
                    resultRooms = rooms[i];
                    break;
                    //return rooms[i];
                }
            }
        }
        if (resultRooms) {
            res.redirect('/room?roomId=' + resultRooms.roomId);
        } else {
            res.header('Content-Type', 'text/html');
            res.send('<h2 style="font-size:30px;margin-top:30%"><center>抱歉，您目前没有正在游戏的房间记录，<a href="/checkIn">戳我开房</a></center></h2>');
            // res.header("Content-Type", "text/html;charset=utf-8");
            // res.end('<h2 style="font-size:30px;margin-top:50%"><center>抱歉，您目前没有正在游戏的房间记录，<a href="/checkIn">戳我开房</a></center></h2>');
        }
    });
    // app.get('/cookieTest/', function (req, res, next) {
    //     axios({
    //         method: 'post',
    //         url: 'http://manage.fanstongs.com/api/login',
    //         data: {
    //             token: getToken()
    //         }
    //     }).then(function (response) {
    //         //console.log(response.data)
    //         userInfo['userid'] = response.data.userid;
    //         res.setHeader('Set-Cookie', cookie.serialize('wxUserInfo', JSON.stringify(userinfo)), {
    //             //maxAge: 60 * 60 * 24 * 7 // 1 week
    //         });
    //         res.redirect(`/${state}`);
    //     }).catch(function (error) {
    //         writeLog('login', error);
    //     });
    //     // res.setHeader('Set-Cookie', cookie.serialize('cookieName', JSON.stringify({
    //     //     openid: 'sdfsfgerdtsefdfg4561s6d16sf16df'
    //     // }), {

    //     //     }));
    //     // res.redirect(`/home`);
    // });
    app.get('/wechat/ticket', function (req, res) {
        //console.log('getticket begin:' + (new Date()).toLocaleString());
        const data = (new Date()).toLocaleString();
        try {
            var page = req.headers.referer;
            var t = {};
            const get = () => {
                var ticketUrl = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + global.access_token + '&type=jsapi';
                //3、获取ticket并且生成随机字符串,时间戳,签名
                request.get(ticketUrl, function (err, response, ticket) {
                    //console.log('getticket getting2：' + data + '~' + (new Date()).toLocaleString());
                    var data = JSON.parse(ticket);
                    //console.log('ticket:' + ticket);
                    const timestamp = parseInt(new Date().getTime() / 1000);
                    t.appId = appid;
                    t.ticket = data.ticket;
                    t.noncestr = sha1(new Date());
                    t.timestamp = timestamp;
                    var string = 'jsapi_ticket=' + t.ticket + '&noncestr=' + t.noncestr + '&timestamp=' + timestamp + '&url=' + page;
                    //console.log('string' + string);
                    //console.log('timestamp' + t.timestamp);
                    t.signature = sha1(string);
                    res.json(t);
                });
            }
            if (!global.access_token) {
                getAccess_token(() => {
                    get();
                    //启动时钟，2小时取一次Access_token
                    clearTimeout(tokenTimer);
                    tokenTimer = setInterval(() => {
                        getAccess_token();
                    }, 7200000);
                });
            } else {
                get();
            }
        } catch (e) {
            writeLog('wechat/ticket', e);
        }
    });
    app.post('/setLoaction', function (req, res) {
        const { roomId, uid, location } = req.body;
        const room = (global.allRooms || []).find(r => r.roomId === roomId);
        if (room) {
            let gamer = room.gamers.find(u => u.uid === uid);
            if (gamer) {
                gamer['location'] = location;
                gamer['offline'] = false;
            }
        }
        res.json({ code: '0000', msg: 'success', result: location });
    })
};