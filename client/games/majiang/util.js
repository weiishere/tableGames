
module.exports = ({ LSprite, LTextField, LShape }) => {
    LTextField.prototype.align = function (parent) {
        if (parent) {
            this.x = (parent.getWidth() - this.getWidth()) / 2;
        } else {
            this.x = (LGlobal.width - this.getWidth()) / 2;
        }
    }
    LTextField.prototype.alignY = function (parent) {
        if (parent) {
            this.y = (parent.getHeight() - this.getHeight()) / 2;
        } else {
            this.y = (LGlobal.height - this.getHeight()) / 2;
        }
    }
    LSprite.prototype.ObjectList = function (typeName) {
        var _arr = new Array();
        for (var i = 0, l = this.childList.length; i < l; i++) {
            var item = this.childList[i];
            if (item.type === typeName) {
                _arr.push(item);
            }
        }
        return _arr;
    }
    LSprite.prototype.align = function (parent) {
        if (parent) {
            this.x = (parent.getWidth() - this.getWidth()) / 2;
        } else {
            this.x = (LGlobal.width - this.getWidth()) / 2;
        }
    }
    LSprite.prototype.alignY = function (parent) {
        if (parent) {
            this.y = (parent.getHeight() - this.getHeight()) / 2;
        } else {
            this.y = (LGlobal.height - this.getHeight()) / 2;
        }
    }
    Array.prototype.isContain = function (item) {
        var isPass = false;
        //this.forEach(function (e) { if (e == item) { isPass = true; return false; } });//forEach循环无法跳出，暂时弃用
        for (var i = 0; i < this.length; i++) { if (this[i] == item) { isPass = true; break; } }
        return isPass;
    }
    const extend = (function() {
        var isObjFunc = function(name) {
            var toString = Object.prototype.toString
            return function() {
                return toString.call(arguments[0]) === '[object ' + name + ']'
            } 
        }
        var   isObject = isObjFunc('Object'),
            isArray = isObjFunc('Array'),
            isBoolean = isObjFunc('Boolean')
        return function extend() {
            var index = 0,isDeep = false,obj,copy,destination,source,i
            if(isBoolean(arguments[0])) {
                index = 1
                isDeep = arguments[0]
            }
            for(i = arguments.length - 1;i>index;i--) {
                destination = arguments[i - 1]
                source = arguments[i]
                if(isObject(source) || isArray(source)) {
                    console.log(source)
                    for(var property in source) {
                        obj = source[property]
                        if(isDeep && ( isObject(obj) || isArray(obj) ) ) {
                            copy = isObject(obj) ? {} : []
                            var extended = extend(isDeep,copy,obj)
                            destination[property] = extended 
                        }else {
                            destination[property] = source[property]
                        }
                    }
                } else {
                    destination = source
                }
            }
            return destination
        }
    })();
    return {
        getRedom: (minNum, maxNum) => {
            switch (arguments.length) {
                case 1: return parseInt(Math.random() * minNum + 1);
                case 2: return parseInt(Math.random() * (maxNum - minNum + 1) + minNum);
                default: return 0;
            }
        },
        createSprite: function (option, callBack) {
            if (typeof option == "function") {
                var _sprite = new LSprite();
                option.call(_sprite);
                return _sprite;
            }
            var _option = extend({
                x: 0,
                y: 0,
                image: null,
                click: undefined,
            }, option || {});
            // var _option = Object.assign(
            //     {
            //         x: 0,
            //         y: 0,
            //         image: "",
            //         click: undefined,
            //     }, option || {})
            var _sprite = new LSprite();
            _sprite.x = _option.x;
            _sprite.y = _option.y;
            if (_option.image) {
                //var bitmap = new LBitmap(new LBitmapData(imglist[_option.image]));
                var bitmap = new LBitmap(new LBitmapData(..._option.image));
                _sprite.addChild(bitmap);
            }
            if (_option.click) {
                _sprite.addEventListener(LMouseEvent.MOUSE_UP, function (e) {
                    _option.click.call(_sprite, e);
                });
            }
            if (callBack) {
                callBack.call(_sprite);
            }
            return _sprite;
        },
        createText: function (text, option, callBack) {
            // var _option = extend({
            //     x: 0,
            //     y: 0,
            //     color: "#ae7318",
            //     size: 20
            // }, option || {});
            var _option = Object.assign(
                {
                    x: 0,
                    y: 0,
                    color: "#ae7318",
                    size: 20
                }, option || {})
            var _text = new LTextField();
            _text.text = text;
            _text.size = _option.size;
            _text.color = _option.color;
            _text.y = _option.y;
            _text.x = _option.x;
            if (callBack) { callBack.call(_text); }
            return _text;
        },
        extend
    }
}