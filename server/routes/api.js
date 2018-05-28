const axios = require('axios');
const sqliteCommon = require('../sqliteCommon');
const apiUrl = 'http://220.167.101.116:8080';

module.exports = (app) => {
    const path = '/api'
    app.get(path + '/node/userIsExists', function (req, res, next) {
        const { openId } = req.body;
        axios.get(`${apiUrl}/node/userIsExists?openid=${openId}`).then(function (response) {
            res.json(response.data);
        }).catch(function (error) {
            console.log('----------------userIsExists error start----------------------');
            console.log(error);
            console.log('-----------------userIsExists error end---------------------');
        })
    });
    app.post(path + '/login', function (req, res, next) {
        const { openId } = req.body;
        axios.post(`${apiUrl}/node/userViewByOpenId?openid=${openId}`).then(function (response) {
            res.json(response.data);
        }).catch(function (error) {
            console.log('----------------login error start----------------------');
            console.log(error);
            console.log('-----------------login error end---------------------');
        })
    });
    app.post(path + '/reg', function (req, res, next) {
        const { openId, username } = req.body;
        axios.post(`${apiUrl}/node/userAdd?openid=${openId}&username=${username}`).then(function (response) {
            res.json(response.data);
        }).catch(function (error) {
            console.log('----------------reg error start----------------------');
            console.log(error);
            console.log('-----------------reg error end---------------------');
        })
    });
    app.post(path + '/checkin', function (req, res, next) {
        const { uid, rule, ruleName, mulriple, colorType, countdown } = req.body;
        const option = {
            gamers: [],
            gamerNumber: 4,
            mulriple: mulriple,//倍数
            gameTime: 4,
            state: 'wait',
            gameType: 'majiang',
            rule: rule,
            ruleName: ruleName,
            colorType: colorType,
            countdown: countdown
        }
        sqliteCommon.insert({
            uid: uid,
            state: 0,
            jsonData: JSON.stringify(option)
        }, function (roomId) {
            res.json(roomId);
        });
    });
    app.post(path + '/getRoom', function (req, res, next) {
        const { roomId, state } = req.body;
        sqliteCommon.getOne({
            roomId, state
        }, function (data) {
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