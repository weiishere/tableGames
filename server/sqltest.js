var fs = require("fs");
var file = "roomDB.db";
var exists = fs.existsSync(file);
var sqlite3 = require("sqlite3").verbose();
const UUID = require('./util/uuid');
const sqliteCommon = require('./sqliteCommon');
//(new UUID()).generateUUID()


var db = new sqlite3.Database(file, function (err) {
    if (err) throw err;
});
db.serialize(function () {
    //新增rooms表

    // sqliteCommon.insert({
    //     uid: '123',
    //     state: 0,
    //     jsonData: ''
    // }, function (data) {
    //     console.log(data);
    // })

    // sqliteCommon.getOne({
    //     roomId: '4531a5ec-f45b-4c20-a97e-bf6d158b2aef'
    // }, function (data) {
    //     console.log(data);
    // })
    
    const sql = `select * from rooms where roomId="4531a5ec-f45b-4c20-a97e-bf6d158b2aef"`;
    db.get(sql, function (err, result) {
        if (err) {
            if (error) error(err);
            throw err;
        }
        console.log(result);
    });
    // sqliteCommon.getList({ }, function (data) {
    //     console.log(data);
    // })
});