const bencode = require('bencode');
const urlParse = require('url').parse;
const fs = require('fs');
const dgram = require('dgram');
const crypto = require('crypto');
const Buffer = require('buffer').Buffer;

var torrent = bencode.decode(fs.readFileSync(process.argv[2]));

var socket = dgram.createSocket('udp4');
var announceReq = createAnnounceReq();

if (torrent['announce-list']) {
	torrent['announce-list'].forEach((trackerUrl, i) => {
		sendUdpAnnounceReq(socket, announceReq, trackerUrl.toString('utf8'));
	});
} else {
	sendUdpAnnounceReq(socket, announceReq, torrent.announce.toString('utf8'));
}

socket.on('error', (err) => {
	console.log(`Socket error:\n${err.stack}`);
	socket.close();
});

socket.on('message', (msg, rinfo) => {
	console.log(`Socket got: ${msg} from ${rinfo.address}:${rinfo.port}`);
});

function sendUdpAnnounceReq(socket, msg, rawUrl, callback=()=>{}) {
	const url = urlParse(rawUrl);
	console.log('Sent message to url ' + url.href + ': ' + msg);
	socket.send(msg, 0, msg.length, url.port, url.host, callback);
}

function createAnnounceReq() {
	const buf = Buffer.alloc(16);
	buf.writeUInt32BE(0x417, 0); // 1st half connection_id
	buf.writeUInt32BE(0x27101980, 4); // 2nd half connection_id
	buf.writeUInt32BE(0x0, 8); // action
	crypto.randomBytes(4).copy(buf, 12); // transaction_id
	return buf;
}
