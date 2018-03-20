// import {
//     addChild,
//     base,
//     LGlobal,
//     LSystem,
//     LSprite,
//     LoadingSample2,
//     init,
//     LInit,
//     LStage,
//     LShape,
//     LBitmap,
//     LBitmapData,
//     LTextField,
//     LDropShadowFilter,
//     LSound,
//     LMouseEvent,
//     LEvent,
//     LKeyboardEvent,
//     LStageScaleMode,
//     LTweenLite,
//     LEasing,
//     LLoadManage,
//     LoadingSample1,
//     LMouseEventContainer
// } from '../../common/lufylegend-1.10.1.min';
import util from './util';
import imgData from './images';

let tool, backLayer, eventBackLayer, loadingLayer;
let imglist = [];
let gamers = {};
const main = function () {
    window.onresize = function () { LGlobal.resize(); }
    LGlobal.stageScale = LStageScaleMode.EXACT_FIT;
    tool = util({ LSprite, LTextField, LSprite, LShape, imglist });
    backLayer = tool.createSprite();
    eventBackLayer = tool.createSprite();
    LSystem.screen(LStage.FULL_SCREEN);
    //LSystem.screen(0.5);
    loadingLayer = new LoadingSample2();
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
    backLayer.die();
    backLayer.removeAllChild();
    gamers['mine'] = new Gamer({
        name: 'name1', point: 100, state: 'wait',
        avatar: ''
    }, { width: 960, height: 80 }, { x: 0, y: 400 }, 'mine');
    gamers['left'] = new Gamer({
        name: 'name2', point: 100, state: 'wait',
        avatar: ''
    }, { width: 80, height: 400 }, { x: 0, y: 0 }, 'left');
    gamers['front'] = new Gamer({
        name: 'name4', point: 100, state: 'wait',
        avatar: ''
    }, { width: 800, height: 80 }, { x: 80, y: 0 }, 'front');
    gamers['right'] = new Gamer({
        name: 'name3', point: 100, state: 'wait',
        avatar: ''
    }, { width: 80, height: 400 }, { x: 880, y: 0 }, 'right');

    backLayer.addChild(gamers['mine']);//加入4个gamer
    backLayer.addChild(gamers['left']);
    backLayer.addChild(gamers['front']);
    backLayer.addChild(gamers['right']);
    gamers.mine.addChild(tool.createSprite({ image: [imglist["head"]] }, function () { this.scaleX = this.scaleY = 0.4; }));

}
function Gamer(userInfo, size, position, type) {
    base(this, LSprite, []);
    this.userInfo = userInfo;
    this.position = position;
    this.size = size;
    this.x = position.x;
    this.y = position.y;
    this.type = type;//mine、left、right、front
    this.setView();
}

Gamer.prototype.setView = function () {
    const self = this;
    //主区域
    this.wrapperLayer = tool.createSprite({}, function () {
        this.graphics.drawRect(1, "#cccccc", [0, 0, self.size.width, self.size.height], true, "#eee");
    })
    this.addChild(this.wrapperLayer);
    //this.addChild(tool.createSprite({ image: [imglist["head"], 0, 0, 80, 10] }));
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