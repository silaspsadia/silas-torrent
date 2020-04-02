const bencode = require('bencode');
const crypto = require('crypto');
const bignum = require('bignum');

module.exports = class {
    constructor(decodedTorrent) {
        this.announce = decodedTorrent.announce;
        this.announceList = decodedTorrent['announce-list'];
        this.info = decodedTorrent.info;
        this.infoHash = calculateInfoHash(this.info);
        this.size = calculateSize(this.info);
        this.nPieces = this.info.pieces.length / 20;
        this.pieces = new Array(this.nPieces).fill({
            touched: false,
            done: false,
            curBlockIndex: 0
        });
    }

    printPieces() {
        console.log(this.pieces);
    }
}

function calculateInfoHash(info) {
    const encodedInfo = bencode.encode(info);
    return crypto.createHash('sha1').update(encodedInfo).digest();
}

function calculateSize(info) {
    const size = info.files ?
        info.files.map(file => file.length).reduce((a, b) => a + b) :
        info.length;
  return bignum.toBuffer(size, {size: 8});
}
