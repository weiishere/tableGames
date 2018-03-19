import {
    addChild,
    base,
    LGlobal,
    LSystem,
    LSprite,
    LoadingSample2,
    init,
    LInit,
    LStage,
    LShape,
    LBitmap,
    LBitmapData,
    LTextField,
    LDropShadowFilter,
    LSound,
    LMouseEvent,
    LEvent,
    LKeyboardEvent,
    LStageScaleMode,
    LTweenLite,
    LEasing,
    LLoadManage,
    LoadingSample1,
    LMouseEventContainer
} from '../../common/lufylegend-1.10.1.min';
import util from './util';
import imgData from './images';
import { text } from '../../../../../Library/Caches/typescript/2.6/node_modules/@types/body-parser';


/*
var Result = (function () {
    const tool = util({ LSprite, LTextField, LSprite, LShape, imglist }),
        backLayer = tool.createSprite(),
        eventBackLayer = tool.createSprite(),
        loadingLayer = new LoadingSample1();
    let imglist = [];
    const main = function () {
        //LSystem.screen(LStage.FULL_SCREEN);
        LSystem.screen(0.5);
        backLayer.graphics.drawRect(1, "#cccccc", [0, 0, LGlobal.width, LGlobal.height], true, "#000000");
        eventBackLayer.graphics.drawRect(1, "#cccccc", [0, 0, LGlobal.width, LGlobal.height], true, "#fff");
        //背景显示
        addChild(eventBackLayer);
        addChild(backLayer);
        backLayer.addChild(loadingLayer);
        LLoadManage.load(imgData, function (progress) {
            loadingLayer.setProgress(progress);
        }, gameInit);
    }
    const gameInit = function (result) {
        imglist = result;
        alert('游戏开始');
    }
    return {
        init: function () {
            LInit(30, "canvas", 640, 960, main, LEvent.INIT);
        },
        removeAll: function () {
            if (LGlobal.frameRate) window.clearInterval(LGlobal.frameRate);
            if (backLayer) { backLayer.removeAllChild(); eventBackLayer.die(); backLayer.die(); }
        }
    }
});*/


let tool, backLayer, eventBackLayer, loadingLayer;
let imglist = [];
const main = function () {
    window.onresize = function () { LGlobal.resize(); }
    LGlobal.stageScale = LStageScaleMode.EXACT_FIT;
    tool = util({ LSprite, LTextField, LSprite, LShape, imglist });
    backLayer = tool.createSprite();
    eventBackLayer = tool.createSprite();
    LSystem.screen(LStage.FULL_SCREEN);
    //LSystem.screen(0.5);
    loadingLayer = new LoadingSample1();
    backLayer.graphics.drawRect(1, "#cccccc", [0, 0, LGlobal.width, LGlobal.height], true, "#000000");
    eventBackLayer.graphics.drawRect(1, "#cccccc", [0, 0, LGlobal.width, LGlobal.height], true, "#fff");
    //背景显示
    addChild(eventBackLayer);
    addChild(backLayer);
    backLayer.addChild(loadingLayer);
    LLoadManage.load(imgData, function (progress) {
        loadingLayer.setProgress(progress);
    }, gameInit);
}
const gameInit = function (result) {
    imglist = result;
    const game_mine = new Gamer({
        name:'name1',
        avatar:'',
        point:100,
        state:'wait'
    },{
        width:800,height:80
    },'mine');
}
function Gamer(userInfo,size, type) {
    base(this, LSprite, []);
    this.userInfo = userInfo;
    this.size=size;
    this.type = type;//mine、left、right、front
    this.setView();
}
Gamer.prototype.setView = function () {
    //主区域
    if(this.type==='mine'){
        this.wrapperLayer=tool.createSprite({}, function () {
            this.graphics.drawRect(1, "#cccccc", [0, 0, 800, 80], true, "#000000");
        })
    }
    this.addChild(this.wrapperLayer);
    //this.wrapperLayer = tool.createSprite({ image: [imglist["cards"], 0, 0, 80, 10] });
    //牌列wrap
    //头像名字分数
}


module.exports = class {
    constructor() { }
    init() {
        LInit(30, "canvas", 960, 480, main, LEvent.INIT);
    }
    removeAll() {
        if (LGlobal.frameRate) window.clearInterval(LGlobal.frameRate);
        if (backLayer) { backLayer.removeAllChild(); eventBackLayer.die(); backLayer.die(); }
    }
}