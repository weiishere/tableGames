const Router = require('koa-router');
let home = new Router();

home.get('home', async (ctx) => {
    await ctx.render('index',{
        title:'koa title222',
        scripts:`<script src='http://localhost:3000/dist/home.bundle.js'></script>`
    })
})
module.exports = home;