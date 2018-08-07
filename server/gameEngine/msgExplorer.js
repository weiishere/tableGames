const writeLog = require('../util/errorLog');
class MsgSender {
    constructor(userScoket, data) {
        this.data = data;
        this.timer;
        this.sendCount = 0;
        this.userScoket = userScoket;
    }
    send(msgExplorer) {
        try {
            this.userScoket.emit('message', JSON.stringify(this.data));
            this.timer = setInterval(() => {
                if (msgExplorer.msgData[this.data.ackId]) {
                    //如果队列中有新的值了，停止
                    this.clear();
                    msgExplorer.msgAck({ ackId: this.data.ackId });
                } else {
                    //最多发送20次，每秒一次
                    if (this.sendCount <= 10) {
                        this.userScoket.emit('message', JSON.stringify(this.data));
                        this.sendCount++;
                    } else {
                        console.log('timeOut:' + this.data.ackId);
                        this.clear();
                        msgExplorer.msgAck({ ackId: this.data.ackId });
                    }
                }
            }, 2000);
        } catch (e) {
            writeLog('MsgExplorer send', e);
        }
    }
    clear() {
        clearInterval(this.timer);
    }
}
class MsgExplorer {
    constructor() {
        //this.roomId = roomId;
        this.index = 0;
        this.queue = [];
        this.msgData = {};
        this.isRunning = false;
    }
    ///**key有值的话，意思是此信息的ack键为固定值，只会存在一条，push之后会清除之前未发送出的消息 */
    setAckCallBack(fn) {
        this.ackCallBack = fn;
    }
    push(userScoket, data, dataKey) {
        //const key = this.roomId + "_" + this.index;
        //console.log('index:' + this.index);
        try {
            let key;
            if (dataKey) {
                key = "msg_" + userScoket.id + "_" + dataKey;
            } else {
                this.index++;
                key = "msg_" + this.index;
            }
            let _data = JSON.parse(data);
            _data['ackId'] = key;
            if (dataKey && this.msgData[key]) {
                //如有dataKey值，需要预先清除之前的消息对象
                this.msgData[key].clear();
                //delete this.msgData[key];
                if (this.queue.find(q => q === key)) {
                    this.queue = this.queue.filter(q => q !== key);
                }
            }

            this.queue.push(key);
            this.msgData[key] = new MsgSender(userScoket, _data);
        } catch (e) {
            writeLog('MsgExplorer push', e);
        }
    }
    loop() {
        this.isRunning = true;
        if (this.queue.length !== 0) {
            const frist = this.queue.reverse().pop();
            if (!this.msgData[frist]) {
                console.log(this.msgData);
                console.log(frist);
                console.log(this.queue);
            }
            this.msgData[frist].send(this);
            //取得第一项
            this.queue.reverse();
            this.loop();
        } else {
            this.isRunning = false;
        }
    }
    run() {
        setInterval(() => {
            if (this.queue.length !== 0 && !this.isRunning) {
                this.loop();
            }
        }, 50);
    }
    msgAck({ ackId, roomId, uid }) {
        try {
            // console.log('----------------------b');
            // console.log(this.msgData);
            // console.log(this.msgData[ackId]);
            //ack必须先看在数组队列中没，如果队列中有，说明是之后添加进来的同类型消息，那么旧的已经被清除掉了，这会儿清除反而会把队列中最新的信息搞掉
            if (this.msgData[ackId]) {
                if (this.queue.find(q => q === ackId)) return;
                //console.log("ack delete:" + ackId);
                this.msgData[ackId].clear();
                delete this.msgData[ackId];
                if (roomId && uid) { this.ackCallBack(roomId, uid); }
            } else {
                //console.log("can't find msgData of ackId");
            }

            // console.log(this.msgData);
            // console.log('----------------------e');
        } catch (e) {
            writeLog('API ACK error', e);
        }
    }
}
module.exports = MsgExplorer;