/*const mess = document.getElementById("mess");
let time = 1;
if (window.WebSocket) {
    var wsServer = new WebSocket('ws://localhost:3300');
    wsServer.onopen = function (e) {
        console.log("连接服务器成功");
        //(typeof e == 'string') && wsServer.send(e);//向后台发送数据
    };
    wsServer.onclose = function (e) {//当链接关闭的时候触发
        console.log("服务器关闭");
    };
    wsServer.onmessage = function (e) {//后台返回消息的时候触发
        console.log(e);
    };
    wsServer.onerror = function (e) {//错误情况触发
        console.log("连接出错", e);
    }
    document.getElementById('btn').addEventListener('click', function (e) {
        console.log("send");
        e.preventDefault();
        wsServer.send(time++);
    }, false);
}*/

var ws = io('ws://localhost:3300');
var sendMsg = function (msg) {
    ws.emit('send.message', msg);
}
var addMessage = function (from, msg) {
    var li = document.createElement('li');
    li.innerHTML = '<span>' + from + '</span>' + ' : ' + msg;
    document.querySelector('#chat_conatiner').appendChild(li);

    // 设置内容区的滚动条到底部
    document.querySelector('#chat').scrollTop = document.querySelector('#chat').scrollHeight;

    // 并设置焦点
    document.querySelector('textarea').focus();

}

var send = function () {
    var ele_msg = document.querySelector('textarea');
    var msg = ele_msg.value.replace('\r\n', '').trim();
    console.log(msg);
    if (!msg) return;
    sendMsg(msg);
    // 添加消息到自己的内容区
    addMessage('你', msg);
    ele_msg.value = '';
}

ws.on('connect', function () {
    console.log("连接服务器");
    // let nickname = 'userName-' + parseInt(Math.random() * 1000000);
    // ws.emit('setName', nickname);
});
ws.on('message', function (data) {
    document.getElementById('contents').innerHTML += data;
});
ws.on('disconnect', function () {
    console.log("与服务其断开");
});

document.getElementById('btn1').addEventListener('click', function (e) {
    //alert('已设置' + document.getElementById('setNameInput').value);
    ws.emit('setName', document.getElementById('setNameInput').value);
}, false);
document.getElementById('btn2').addEventListener('click', function (e) {
    ws.emit('sayTo', {
        from: document.getElementById('setNameInput').value,
        to: document.getElementById('toNameInput').value,
        msg: document.getElementById('sendMes').value
    });
}, false);
/*
document.querySelector('textarea').addEventListener('keypress', function (event) {
    if (event.which == 13) {
        send();
    }
});
document.querySelector('textarea').addEventListener('keydown', function (event) {
    if (event.which == 13) {
        send();
    }
});
document.querySelector('#send').addEventListener('click', function () {
    send();
});

document.querySelector('#clear').addEventListener('click', function () {
    document.querySelector('#chat_conatiner').innerHTML = '';
});*/