(function () {
    function UUID() {
        this.id = this.createUUID();
    }
    UUID.prototype.valueOf = function () { return this.id; };
    UUID.prototype.toString = function () { return this.id; };
    UUID.prototype.createUUID = function () {
        var dg = new Date(1582, 10, 15, 0, 0, 0, 0);
        var dc = new Date();
        var t = dc.getTime() - dg.getTime();
        var tl = UUID.getIntegerBits(t, 0, 31);
        var tm = UUID.getIntegerBits(t, 32, 47);
        var thv = UUID.getIntegerBits(t, 48, 59) + '1'; // version 1, security version is 2  
        var csar = UUID.getIntegerBits(UUID.rand(4095), 0, 7);
        var csl = UUID.getIntegerBits(UUID.rand(4095), 0, 7);

        var n = UUID.getIntegerBits(UUID.rand(8191), 0, 7) +
            UUID.getIntegerBits(UUID.rand(8191), 8, 15) +
            UUID.getIntegerBits(UUID.rand(8191), 0, 7) +
            UUID.getIntegerBits(UUID.rand(8191), 8, 15) +
            UUID.getIntegerBits(UUID.rand(8191), 0, 15); // this last number is two octets long  
        return tl + tm + thv + csar + csl + n;
    };
    UUID.prototype.generateUUID = function () {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    };


    UUID.getIntegerBits = function (val, start, end) {
        var base16 = UUID.returnBase(val, 16);
        var quadArray = new Array();
        var quadString = '';
        var i = 0;
        for (i = 0; i < base16.length; i++) {
            quadArray.push(base16.substring(i, i + 1));
        }
        for (i = Math.floor(start / 4); i <= Math.floor(end / 4); i++) {
            if (!quadArray[i] || quadArray[i] == '') quadString += '0';
            else quadString += quadArray[i];
        }
        return quadString;
    };

    UUID.returnBase = function (number, base) {
        return (number).toString(base).toUpperCase();
    };

    UUID.rand = function (max) {
        return Math.floor(Math.random() * (max + 1));
    };
    module.exports = UUID;
})();