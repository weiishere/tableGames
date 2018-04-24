var loadCommon = {
    path: "/qingjian/content/",
    imgList: [
    "img/1.png",
    "img/2.png",
    "img/3.png",
    "img/4.png",
    "img/5.png",
    "img/6.png",
    "img/7.png",
    "img/8.png",
    "img/9.png",
    "img/10.png",
    "img/11.png",
    "img/13.jpg",
    "img/14.jpg",
    "img/16.png",
    "img/17.png",
    "img/18.png",
    "img/up.png",
    "img/baidu.png",
    "img/gaode.png"
    ],
    count: 0,
    load: function (url) {
        var _self = this;
        var img = new Image();
        img.onload = function () {
            _self.count++;
        }
        img.onerror = function () {
            _self.count++;
            alert("错误：" + url);
        }
        img.src = url;
    },
    init: function () {
        if (isLoding) { return false; }
        isLoding = true;
        var _self = this;
        
        var imgs = document.getElementsByTagName('img');
        for (var i = 0; i < imgs.length; i++) {
            var src = imgs.item(i).getAttribute("dsrc");
            imgs.item(i).setAttribute("src", src);
        }
        _self.imgList.forEach(function (item) {
            _self.load(_self.path + item);
        });
        var length = _self.imgList.length;
        var _t = window.setInterval(function () {
            document.querySelector(".loading i").innerText = parseInt((_self.count / length) * 100) + "%";
            document.querySelector(".progress").style.left = -(((length - _self.count) / length) * 100) + "%";
            if (_self.count == length) {
                isLoding = false;
                document.getElementById('music').play();
                document.querySelector(".loading").style.display = "none";
                window.clearInterval(_t);
                runPage = new FullPage({
                    id: 'pageContain', slideTime: 800, continuous: false,
                    effect: {
                        transform: {
                            translate: 'Y',
                            scale: [0.1, 1],
                            rotate: [45, 0]
                        },
                        opacity: [0, 1]
                    },
                    mode: 'wheel,touch,nav:navBar',
                    easing: 'ease',
                    continuous:true
                });
                runPage.next();
                window.setTimeout(function () { runPage.next(); }, 800);
            }
        }, 100);
    }
}