
var fs = require("fs");
var file = "roomDB.db";
var exists = fs.existsSync(file);
var sqlite3 = require("sqlite3").verbose();
const UUID = require('./util/uuid');
//(new UUID()).generateUUID()

var db = new sqlite3.Database(file, function (err) {
    if (err) throw err;
});

module.exports = {
    insert: ({ state, uid, jsonData }, done, error) => {
        db.serialize(function () {
            //数据库对象的run函数可以执行任何的SQL语句，该函数一般不用来执行查询
            var insert = db.prepare("INSERT OR REPLACE INTO rooms (roomId,checkinTime,updateTime,state,checkiner,jsonData) VALUES (?,?,?,?,?,?)"); //插入或者替换数据
            const uuid = (new UUID()).generateUUID();
            insert.run(uuid, Date.now(), Date.now(), state, uid, jsonData, function (err, result) {
                if (err) {
                    if (error) error(err);
                    throw err;
                }
                done && done(uuid);
            });
            // insert.run((new UUID()).generateUUID(), Date.now(), Date.now(), 0, 123);
            // insert.run((new UUID()).generateUUID(), Date.now(), Date.now(), 0, 1234);
            // insert.run((new UUID()).generateUUID(), Date.now(), Date.now(), 0, 1235);
            // for (var i = 0; i < 10; i++) {
            //     insert.run(i, "stu" + i);   //insert some data.
            // }
            insert.finalize();
        })
    },
    //获取房间数据
    getOne: ({ roomId, state }, done, error) => {
        db.serialize(function () {
            //roomId = '6c29d288-81ce-4843-b5b2-25c8b84d4e18'
            const sql = state ? `select * from rooms where roomId="${roomId}" and state=${state}` : `select * from rooms where roomId="${roomId}"`;
            db.get(sql, function (err, result) {
                if (err) {
                    if (error) error(err);
                    throw err;
                }
                done && done(result);
            });
        })
    },
    //获取房间数列表
    getList: ({ state }, done, error) => {
        db.serialize(function (roomId) {
            //6c29d288-81ce-4843-b5b2-25c8b84d4e18
            const sql = state ? `select * from rooms state=${state}` : `select * from rooms`;
            db.all(sql, function (err, rows) {
                if (err) {
                    if (error) error(err);
                    throw err;
                }
                done && done(rows);
            });
        })
    },
    //更新房间状态
    updateState: ({ roomId, state }, done, error) => {
        db.serialize(function () {
            //roomId = '6c29d288-81ce-4843-b5b2-25c8b84d4e18'
            const sql = `UPDATE rooms SET state = ${state},updateTime=${Date.now()} WHERE roomId = "${roomId}" AND (state = 1 or state = 0)`;//只有state=0或1才允许更新数据
            db.run(sql, function (err) {
                if (err) {
                    if (error) error(err);
                    throw err;
                }
                done && done(this.changes);
            });
        })
    },
    //删除房间
    deleteRoom: ({ roomIds }, done, error) => {
        db.serialize(function () {
            //roomId = '6c29d288-81ce-4843-b5b2-25c8b84d4e18'
            const removeRoomIds = roomIds.map(item => "'" + item + "'").join(',');
            const sql = `DELETE FROM rooms WHERE roomId in (${removeRoomIds})`;//只有state=0或1才允许更新数据
            db.run(sql, function (err) {
                if (err) {
                    if (error) error(err);
                    throw err;
                }
                done && done(this.changes);
            });
        })
    },
}


//内存型，数据不会永久保存
// database = new sqlite3.Database(":memory:", function (e) {
//     if (err) throw err;
// });