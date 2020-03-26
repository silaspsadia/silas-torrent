const net = require('net');
const msgBuilder = require('./msg-builder');

module.exports = (peer, torrent) => {
    const socket = new net.Socket();

    socket.on('error', (err) => {
        console.log(`Socket error:\n${err.stack}`);
    });

    socket.connect(peer.port, peer.ip, () => {
        socket.write(msgBuilder.buildHandshake(torrent));
    });

