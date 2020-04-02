const crypto = require('crypto');
const Buffer = require('buffer').Buffer;
const util = require('./util');
const msgBuilder = require('./msg-builder');


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
            case null:
                keepAliveHandler(socket, torrent);
            case 0:
                chokeHandler(socket);
                break;
            case 1:
                unchokeHandler(socket, torrent);
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

function keepAliveHandler(socket, torrent) {
    requestPiece(socket, torrent);
}

function chokeHandler(socket) {
    socket.end();
}

function unchokeHandler(socket, torrent) {
    requestPiece(socket, torrent);
}

function haveHandler(payload, socket, torrent) {
    const pieceIndex = payload.readUInt32BE(0);
    torrent.reqQueue.push(pieceIndex);
    console.log(pieceIndex);
    if (torrent.reqQueue.length === 0) {
        requestPiece(socket, torrent);
    }
}

function bitfieldHandler(payload, socket, torrent) {}

function pieceHandler(payload, socket, torrent) {
    const pieceIndex = payload.index;
    const piece = torrent.pieces[pieceIndex];
    // do something with block
    piece.touched = true;
    piece.curBlockIndex = piece.curBlockIndex + payload.block.length;
    console.log('Current reqQueue length: ',
        torrent.reqQueue.length);
    console.log('Got piece at index ', pieceIndex, 
        ', block index ', piece.curBlockIndex / torrent.BLOCK_LEN, 
        '/', torrent.pieceNumBlocks(pieceIndex),
        ': ', payload.block);
    requestPiece(socket, torrent);
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

function requestPiece(socket, torrent) {
    console.log('\n\nSENT REQUEST\n\n');
    while (torrent.reqQueue.length > 0) {
        const index = torrent.reqQueue.shift();
        socket.write(msgBuilder.buildRequest({
            index: index,
            begin: torrent.pieces[index].curBlockIndex,
            length: torrent.BLOCK_LEN
        }));
    }
}
