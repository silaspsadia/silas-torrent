const bencode = require('bencode');
const crypto = require('crypto');
const bignum = require('bignum');

module.exports = class {
    constructor(decodedTorrent) {
        this.BLOCK_LEN = Math.pow(2, 14);
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
        this.reqQueue = [];
    }

    pieceLen(pieceIndex) {
        const totalLength = bignum.fromBuffer(this.size).toNumber();
        const pieceLen = this.info['piece length'];
        return pieceIndex == this.nPieces ? totalLength % pieceLen : pieceLen; 
    }

    pieceNumBlocks(pieceIndex) {
        const pieceLen = this.pieceLen(pieceIndex);
        return Math.ceil(pieceLen / this.BLOCK_LEN);
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
