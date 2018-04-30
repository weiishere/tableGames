//测试抢杠

this.gameState[0].cards = [
    this.getSpecifiedCard('t', 1), this.getSpecifiedCard('t', 2), this.getSpecifiedCard('t', 3),
    this.getSpecifiedCard('t', 4), this.getSpecifiedCard('t', 5), this.getSpecifiedCard('t', 6),
    this.getSpecifiedCard('w', 1), this.getSpecifiedCard('w', 1), this.getSpecifiedCard('w', 1),
    this.getSpecifiedCard('w', 2), this.getSpecifiedCard('w', 3), this.getSpecifiedCard('w', 4), this.getSpecifiedCard('w', 5)
].sort(objectArraySort('key'));
this.gameState[1].cards = [
    this.getSpecifiedCard('t', 4), this.getSpecifiedCard('t', 4), this.getSpecifiedCard('t', 5),
    this.getSpecifiedCard('t', 5), this.getSpecifiedCard('t', 6), this.getSpecifiedCard('t', 6),
    this.getSpecifiedCard('w', 5), this.getSpecifiedCard('w', 5), this.getSpecifiedCard('w', 6),
    this.getSpecifiedCard('w', 7), this.getSpecifiedCard('w', 7), this.getSpecifiedCard('w', 8), this.getSpecifiedCard('w', 1)
].sort(objectArraySort('key'));
this.gameState[2].cards = [
    this.getSpecifiedCard('t', 1), this.getSpecifiedCard('t', 2), this.getSpecifiedCard('t', 3),
    this.getSpecifiedCard('t', 6), this.getSpecifiedCard('t', 8), this.getSpecifiedCard('t', 9),
    this.getSpecifiedCard('w', 2), this.getSpecifiedCard('w', 2), this.getSpecifiedCard('w', 2),
    this.getSpecifiedCard('w', 6), this.getSpecifiedCard('w', 7), this.getSpecifiedCard('w', 8),
    this.getSpecifiedCard('w', 9)
].sort(objectArraySort('key'));

let sssIndex = 10;
sssIndex++;
const cardByCatch = sssIndex <= 3 ? { key: 'card-t-8-' + sssIndex, number: 8, color: 't' } : { key: 'card-t-6-' + sssIndex, number: 6, color: 't' };