const Router = require('koa-router');
let router = new Router()
const home = require('./home');

// 装载所有子路由
router.use('/', home.routes(), home.allowedMethods());


module.exports = router;