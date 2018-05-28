

const apiRoute = require('./api');
const OAuth = require('node-wechat-oauth');
const getToken = require('../util/token');
const cookie = require('cookie');
const axios = require('axios');
const appid = 'wxf6a4e87064c3fbd2';
const secret = '7fb75eea66988061a1ed9578e7d8fef4';
let tokens = {};
const oauth = new OAuth(appid, secret);
const apiUrl = 'http://220.167.101.116:8080';
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

module.exports = (app) => {
    apiRoute(app);
    app.get('/home/', function (req, res, next) {
        res.render('index.ejs', {
            title: '掌派桌游-创建房间',
            scripts: `<script src='http://apps.bdimg.com/libs/fastclick/1.0.0/fastclick.min.js'></script><script src='/dist/home.bundle.js'></script>`
        });
    });
    app.get('/room/', function (req, res, next) {
        res.render('room.ejs', {
            title: '掌派桌游-房间',
            scripts: `<script src='/frame/socket.io-1.4.5.js'></script><script src='/dist/room.bundle.js?dist=043003'></script>`
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
        console.log('code:' + code);
        const result = await oauth.getAccessToken(code);
        console.log(result);
        const accessToken = result.data.access_token;
        const openid = result.data.openid;
        console.log(accessToken + '---' + openid);
        //这一步先根据openId判断数据库有没有数据，有数据直接获取，没有数据写入之后再操作
        let userinfo = await oauth.getUser(openid);

        console.log("userInfo:" + userInfo);
        axios.get(`http://manage.fanstongs.com/api/login?openid=${userinfo.openid}&token=${getToken()}&username=${userinfo.niceName}&head=${userinfo.headimgurl}`, {
            // openid: userinfo.openid,
            // username: userinfo.niceName,
            // head: userinfo.headimgurl,
            //token: _token
        }).then(function (response) {
            console.log(response.data)
            userinfo['userid'] = response.data.userid;
            res.setHeader('Set-Cookie', cookie.serialize('wxUserInfo', JSON.stringify(userinfo)));
            res.redirect(`/${state}`);
        }).catch(function (error) {
            console.log('----------------login api error start----------------------');
            console.log(error);
            console.log('-----------------login api error end---------------------');
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

    app.get('/cookieTest/', function (req, res, next) {
        axios({
            method: 'post',
            url: 'http://manage.fanstongs.com/api/login',
            data: {
                token: getToken()
            }
        }).then(function (response) {
            console.log(response.data)
            userinfo['userid'] = response.data.userid;
            res.setHeader('Set-Cookie', cookie.serialize('wxUserInfo', JSON.stringify(userinfo)));
            res.redirect(`/${state}`);
        }).catch(function (error) {
            console.log('----------------login api error start----------------------');
            console.log(error);
            console.log('-----------------login api error end---------------------');
        });
        // res.setHeader('Set-Cookie', cookie.serialize('cookieName', JSON.stringify({
        //     openid: 'sdfsfgerdtsefdfg4561s6d16sf16df'
        // }), {

        //     }));
        // res.redirect(`/home`);
    });


    // app.post('/api/login', function (req, res) {
    //     // 输出 JSON 格式
    //     response = {
    //         first_name: req.body.first_name,
    //         last_name: req.body.last_name
    //     };
    //     console.log(response);
    //     res.end(JSON.stringify(response));
    // })
};