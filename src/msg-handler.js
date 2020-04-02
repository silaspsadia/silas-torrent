const crypto = require('crypto');
const Buffer = require('buffer').Buffer;
const util = require('./util');
const msgBuilder = require('./msg-builder');

const BLOCK_LEN = Math.pow(2, 14);

const MessageType = {
    "null": "KEEPALIVE",
    "0" : "CHOKE",
    "1" : "UNCHOKE",
    "4" : "HAVE",
    "5" : "BITFIELD",
    "6" : "REQUEST",
    "7" : "PIECE",
    "8" : "CANCEL",
    "9" : "PORT"
};

module.exports = (msg, socket, torrent) => {
    if (isHandshake(msg)) {
        socket.write(msgBuilder.buildInterested());
    } else {
        msg = parse(msg);
        console.log('Got message: ', MessageType[msg.id] || msg.id);
        switch(msg.id) {
            case 0:
                chokeHandler(socket);
                break;
            case 1:
                unchokeHandler(socket);
                break;
            case 4:
                haveHandler(msg.payload, socket, torrent);
                break;
            case 5:
                bitfieldHandler(msg.payload, socket, torrent);
                break;
            case 7:
                pieceHandler(msg.payload, socket, torrent);
                break;
        }
        socket.write(msgBuilder.buildInterested());
    }
}

function chokeHandler(socket) {
    socket.end();
}

function unchokeHandler(socket) {
    socket.write(msgBuilder.buildInterested());
}

function haveHandler(payload, socket, torrent) {
    const pieceIndex = payload.readUInt32BE(0);
    const piece = torrent.pieces[pieceIndex];
    console.log(pieceIndex);
    if (!piece.touched) {
        piece.touched = true;
        console.log(piece.curBlockIndex);
        socket.write(msgBuilder.buildRequest({
            index: pieceIndex,
            begin: piece.curBlockIndex,
            length: BLOCK_LEN
        }));
    }
}

function bitfieldHandler(payload, socket, torrent) {}

function pieceHandler(payload, socket, torrent) {
    const pieceIndex = payload.index;
    const piece = torrent.pieces[pieceIndex];
    // do something with block
    piece.touched = true;
    piece.curBlockIndex = payload.block.length;
    console.log(payload.block);
    socket.write(msgBuilder.buildRequest({
        index: pieceIndex,
        begin: piece.curBlockIndex,
        length: BLOCK_LEN
    }));
}

function parse(msg) {
    const id = msg.length > 4 ? msg.readInt8(4) : null;
    let payload = msg.length > 5 ? msg.slice(5) : null;
    if (id === 6 || id === 7 || id === 8) {
        const rest = payload.slice(8);
        payload = {
            index: payload.readInt32BE(0),
            begin: payload.readInt32BE(4)
        };
        payload[id === 7 ? 'block' : 'length'] = rest;
    }
    return {
        size: msg.readUInt32BE(0),
        id: id,
        payload: payload
    };
}

function isHandshake(msg) {
    return msg.length === msg.readUInt8(0) + 49 &&
        msg.toString('utf8', 1) === 'BitTorrent protocol';
}
