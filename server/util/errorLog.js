const writeLog = function (fuName, info) {
    console.log('---------------------------' + fuName + ' error--start--(' + (new Date()).toLocaleString() + ')----------------------');
    console.log(info);
    console.log('---------------------------' + fuName + ' error--end-----------------------');
}

module.exports = writeLog;