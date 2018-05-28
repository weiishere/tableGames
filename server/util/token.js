const MD5 = require('md5.js');
const format = require('date-format');

const getToken = function () {
    const date = format('yyyyMMddhhmm', new Date());
    const md5stream = new MD5();
    md5stream.end('zhangsan-' + date);
    const _token = md5stream.read().toString('hex');
    return _token;
}

module.exports = getToken;