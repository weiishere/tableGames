const getRedom = function (minNum, maxNum) {
    switch (arguments.length) {
        case 1: return parseInt(Math.random() * minNum + 1);
        case 2: return parseInt(Math.random() * (maxNum - minNum + 1) + minNum);
        default: return 0;
    }
}

module.exports = getRedom;