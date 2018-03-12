const mess = document.getElementById("mess");
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
}
/*
var ws = io.connect('http://localhost:3300');
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
    // var nickname = window.prompt('输入你的昵称!');
    // while (!nickname) {
    //     nickname = window.prompt('昵称不能为空，请重新输入!')
    // }
    let nickname = 'name' + Math.random();
    ws.emit('join', nickname);
});

// 昵称有重复
ws.on('nickname', function () {
    var nickname = window.prompt('昵称有重复，请重新输入!');
    while (!nickname) {
        nickname = window.prompt('昵称不能为空，请重新输入!')
    }
    ws.emit('join', nickname);
});

ws.on('send.message', function (from, msg) {
    addMessage(from, msg);
});

ws.on('announcement', function (from, msg) {
    addMessage(from, msg);
});

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