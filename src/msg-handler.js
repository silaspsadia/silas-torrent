const crypto = require('crypto');
const Buffer = require('buffer').Buffer;
const util = require('./util');
const msgBuilder = require('./msg-builder');

const MessageType = {
    "0" : "CHOKE",
    "1" : "UNCHOKE",
    "4" : "HAVE",
    "5" : "BITFIELD",
    "6" : "REQUEST",
    "7" : "PIECE",
    "8" : "CANCEL",
    "9" : "PORT"
};

module.exports = (msg) => {
    if (isHandshake(msg)) {
        socket.send(msgBuilder.buildInterested());
    } else {
        msg = parse(msg);
        console.log('Got message: ', MessageType[msg.id] || msg.id);
        switch(msg.id) {
            case 0:
                chokeHandler();
                break;
            case 1:
                unchokeHandler();
                break;
            case 4:
                haveHandler(msg.payload);
                break;
            case 5:
                bitfieldHandler(msg.payload);
                break;
            case 7:
                pieceHandler(msg.payload);
                break;
        }
    }
}

function chokeHandler() {}

function unchokeHandler() {}

function haveHandler(payload) {}

function bitfieldHandler(payload) {}

function pieceHandler(payload) {}

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
