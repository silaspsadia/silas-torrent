const net = require('net');
const msgBuilder = require('./msg-builder');
const msgHandler = require('./msg-handler');

module.exports = (peer, torrent) => {
    const socket = new net.Socket();

    socket.on('error', (err) => {
        console.log(`Socket error:\n${err.stack}`);
    });

    socket.connect(peer.port, peer.ip, () => {
        socket.write(msgBuilder.buildHandshake(torrent));
    });

    listenForMessages(socket, (msg) => {
        msgHandler(msg, socket);
    })
}

function listenForMessages(socket, callback) {
    let savedBuf = Buffer.alloc(0);
    let handshake = true;

    socket.on('data', data => {
        // msgLen calculates the length of a whole message
        const msgLen = () => handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
        savedBuf = Buffer.concat([savedBuf, data]);

        while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
          callback(savedBuf.slice(0, msgLen()));
          savedBuf = savedBuf.slice(msgLen());
          handshake = false;
        }
    });
}

function isHandshake(msg) {
    return msg.length === msg.readUInt8(0) + 49 &&
        msg.toString('utf8', 1) === 'BitTorrent protocol';
}
