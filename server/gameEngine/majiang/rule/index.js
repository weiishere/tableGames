const chengdu = require('./rule_chengdu');
const guangan = require('./rule_guangan');

//changdu,guangan

const getRule = (type) => {
    let rule;
    switch (type) {
        case 'chengdu':
            rule = chengdu;
            break;
        case 'guangan':
            rule = guangan;
            break;
        default:
            rule = chengdu;
            break;
    }
    return rule;
}

module.exports = getRule;