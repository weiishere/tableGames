const express = require('express');
const app = express();
const router = express.Router();
const expressWS = require('express-ws');


var wsRouter = null;

class WSRouter {
    constructor(server, app) {
        this.server = server;
        this.app = app;
        expressWS(this.app, this.server);
    }
    /**
     * 接受client端连接
     */
    lintenClientConnect() {
        var me = this;

        this.app.ws('/', function (ws, req) {
            console.log("--------------client connect to server successful!");
            me.clients.push(ws);
            ws.on('message', function (msg) {
                console.log("receive client msg :", msg);
                me.receiveCmd(msg);
            });
            ws.on("close", function (msg) {
                console.log("client is closed");
                for (var index = 0; index < me.clients.length; index++) {
                    if (me.clients[index] == this) {
                        me.clients.splice(index, 1)
                    }
                }
            });
        });
    }
    /**
     * 发送command到client端
     * @param msg 
     * @param cb 
     */
    sendCmd(msg, cb) {

    }

    /**
     * 接收client的command请求
     * @param cmd 
     */
    receiveCmd(cmd) {

    }

    static init(server,app) {
        if (wsRouter == null && server != null) {
            wsRouter = new WSRouter(server,app);
        }
        return wsRouter;
    }
}

module.exports = WSRouter