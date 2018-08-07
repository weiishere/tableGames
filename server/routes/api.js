const axios = require('axios');
const sqliteCommon = require('../sqliteCommon');
const getToken = require('../util/token');
const writeLog = require('../util/errorLog');
const apiUrl = 'http://220.167.101.116:8080';
const qs = require('qs');

module.exports = (app) => {
    const path = '/api';
    app.post(path + '/login', function (req, res, next) {
        const { openid, nickname, headimgurl } = req.body;
        //const url = `http://manage.fanstongs.com/api/login?openid=${openId}&token=${getToken()}&username=${nickname}&headUrl=${headimgurl}`;
        let _url = `http://manage.fanstongs.com/api/login`;
        const _token = getToken();

        const data = {
            openid: openid,
            username: nickname,
            headUrl: headimgurl,
            token: _token
        }
        axios.post(_url, qs.stringify(data))
            .then((response) => {
                if (!response.data.userid) {
                    writeLog('login api then', response);
                    res.json(response.data);
                }
                res.json(response.data);
            }).catch((error) => {
                writeLog('login api catch', error);
            });
        // axios.post(encodeURI(_url), {
        //     openid: openid,
        //     username: nickname,
        //     headUrl: headimgurl,
        //     token: _token
        // }).then(function (response) {
        //     if (!response.data.userid) {
        //         writeLog('login api then', response);
        //     }
        //     res.json(response.data);
        // }).catch(function (error) {
        //     writeLog('login api', error);
        // });
    });
    app.post(path + '/checkin', function (req, res, next) {
        try {
            const { uid, rule, ruleName, mulriple, colorType, countdown, roomCardNum, deskTop, isDev } = req.body;
            if (!uid) {
                res.json('none');
                return;
            }
            let option = {
                gamers: [],
                gamerNumber: 4,
                mulriple: mulriple,//倍数
                gameTime: 4 * (roomCardNum ? parseInt(roomCardNum) : 1),
                state: 'wait',
                gameType: 'majiang',
                rule: rule,
                ruleName: ruleName,
                colorType: colorType,
                countdown: countdown,
                deskTop: deskTop
            }
            if (isDev) {
                sqliteCommon.insert({
                    uid: uid,
                    state: 0,
                    jsonData: JSON.stringify(option)
                }, function (roomId) {
                    res.json(roomId);
                });
            } else {
                axios.post(`http://manage.fanstongs.com/api/getRoomCard`, qs.stringify({
                    userid: uid,
                    number: roomCardNum,
                    token: getToken()
                })).then(function (response) {
                    console.log(response.data);
                    option['roomCards'] = response.data;
                    sqliteCommon.insert({
                        uid: uid,
                        state: 0,
                        jsonData: JSON.stringify(option)
                    }, function (roomId) {
                        res.json(roomId);
                    });
                }).catch(function (error) {
                    writeLog('getRoomCard api', error);
                })
            }
        } catch (error) {
            writeLog('checkin api', error);
        }
    });
    app.post(path + '/updateBoardData', function (req, res, next) {
        const { boardid, recodeData } = req.body;
        axios.post(`http://manage.fanstongs.com/api/updateBoardData`, qs.stringify({
            boardid: boardid,
            collectData: recodeData,
            token: getToken()
        })).then(function (response) {
            console.log(response.data);
            res.json(response.data);
        }).catch(function (error) {
            writeLog('updateBoardData api', error);
        })
    });
    app.post(path + '/addBoard', function (req, res, next) {
        const { roomcardid, playuserid } = req.body;
        axios.post(`http://manage.fanstongs.com/api/addBoard`, qs.stringify({
            roomcardid: roomcardid,
            playuserid: playuserid,
            token: getToken()
        })).then(function (response) {
            console.log(response.data);
            res.json(response.data);
        }).catch(function (error) {
            writeLog('addBoard api', error);
        })
    });
    app.post(path + '/getRoom', function (req, res, next) {
        const { roomId, state } = req.body;
        sqliteCommon.getOne({
            roomId, state
        }, function (data) {
            res.json(data);
        });
    });
    app.post(path + '/getRoomByUserId', function (req, res, next) {
        const { userId } = req.body;
        sqliteCommon.getRoomListByUser(userId, function (data) {
            res.json(data);
        });
    });
    app.post(path + '/updateState', function (req, res, next) {
        const { roomId, state } = req.body;
        sqliteCommon.updateState({
            roomId, state
        }, function (data) {
            res.json(data);
        });
    });
}