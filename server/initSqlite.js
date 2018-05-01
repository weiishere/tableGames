var fs = require("fs");
var file = "roomDB.db";
var exists = fs.existsSync(file);
var sqlite3 = require("sqlite3").verbose();
const UUID = require('./util/uuid');
//(new UUID()).generateUUID()

if (!exists) {
    console.log("Creating DB file.");
    fs.openSync(file, "w");
}

var db = new sqlite3.Database(file, function (err) {
    if (err) throw err;
});
db.serialize(function () {
    //新增rooms表
    db.run("CREATE TABLE IF NOT EXISTS rooms (" +
        "roomId TEXT PRIMARY KEY NOT NULL," +    //id
        "checkinTime INTEGER," +                 //开房时间
        "updateTime INTEGER," +                 //最后活跃时间
        "state INTEGER," +                     //状态
        "checkiner INTEGER," +                 //开房者
        "jsonData TEXT" +                            //房间jsonData数据
        ") ", function () {
            console.log('success');
        });
    //数据库对象的run函数可以执行任何的SQL语句，该函数一般不用来执行查询
    //var insert = db.prepare("INSERT OR REPLACE INTO rooms (roomId,checkinTime,updateTime,state,checkiner) VALUES (?,?,?,?,?)"); //插入或者替换数据
    // const uuid = (new UUID()).generateUUID();
    // console.log(uuid);
    // insert.run(uuid, Date.now(), Date.now(), 3, 895, function (err) {
    //     console.log(this);
    // });
    //insert.finalize();
});








//内存型，数据不会永久保存
// database = new sqlite3.Database(":memory:", function (e) {
//     if (err) throw err;
// });