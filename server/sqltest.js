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
    //     roomId: 'b83635a6-2f0e-445b-aaa7-8aa7c29bf586'
    // }, function (data) {
    //     console.log(data);
    // })

    sqliteCommon.getList({ }, function (data) {
        console.log(data);
    })
});