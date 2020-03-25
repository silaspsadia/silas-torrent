const bencode = require('bencode');
const urlParse = require('url').parse;
const fs = require('fs');
const dgram = require('dgram');
const crypto = require('crypto');
const Buffer = require('buffer').Buffer;
const util = require('./util');
const torrentParser = require('./torrent-parser');

const MessageType = {
	CONNECT: 0,
	ANNOUNCE: 1
};

var torrent = torrentParser.parse(bencode.decode(fs.readFileSync(process.argv[2])));

var trackerUrl = torrent.announce.toString('utf8');
var socket = dgram.createSocket('udp4');
var connectReq = createConnectReq();

sendUdpMessage(socket, connectReq, trackerUrl);

socket.on('error', (err) => {
	console.log(`Socket error:\n${err.stack}`);
	socket.close();
});

socket.on('message', (msg, rinfo) => {
	if (respType(msg) == MessageType.CONNECT) {
		printRes(parseConnectRes(msg), rinfo);
		const connectRes = parseConnectRes(msg);
		const announceReq = createAnnounceReq(connectRes.connectionId, torrent);
		sendUdpMessage(socket, announceReq, trackerUrl);
	} else if (respType(msg) == MessageType.ANNOUNCE) {
		printRes(parseAnnounceRes(msg), rinfo);
		const announceRes = parseAnnounceRes(msg);
	}	
});

function respType(msg) {
	return msg.readUInt32BE(0);
}

function sendUdpMessage(socket, msg, rawUrl, callback=()=>{}) {
	const url = urlParse(rawUrl);
	console.log('Sent message to url ' + url.href + ': ' + msg.inspect() + '\n');
	socket.send(msg, 0, msg.length, url.port, url.hostname, callback);
}

function createConnectReq() {
	const buf = Buffer.alloc(16);
	buf.writeUInt32BE(0x417, 0); // 1st half connection_id
	buf.writeUInt32BE(0x27101980, 4); // 2nd half connection_id
	buf.writeUInt32BE(0x0, 8); // action (0 === Connect)
	crypto.randomBytes(4).copy(buf, 12); // transaction_id
	return buf;
}

function parseConnectRes(connectRes) {
	return {
		action: connectRes.readUInt32BE(0),
		transactionId: connectRes.readUInt32BE(4),
		connectionId: connectRes.slice(8)
	};
}

function createAnnounceReq(connectionId, torrent, port=6881) {
	const buf = Buffer.alloc(98);
	connectionId.copy(buf, 0); // connection_id
	buf.writeUInt32BE(0x1, 8); // action (1 === announce)
	crypto.randomBytes(4).copy(buf, 12); // transaction_id
	torrent.infoHash.copy(buf, 16); // info_hash
	util.genId().copy(buf, 36); // peer_id
	Buffer.alloc(8).copy(buf, 56); // downloaded
	torrent.size.copy(buf, 64); // left
	Buffer.alloc(8).copy(buf, 72) // uploaded
	buf.writeUInt32BE(0, 80); // event
	buf.writeUInt32BE(0, 84); // ip address
	crypto.randomBytes(4).copy(buf, 88); // key
	buf.writeInt32BE(-1, 92); // num_want
	buf.writeUInt16BE(port, 96); // port
	return buf;
}

function parseAnnounceRes(announceRes) {
	const peerBuffer = announceRes.slice(20);
	var addresses = [];
	for (var i = 0; i < peerBuffer.length; i += 6) {
		addresses.push(peerBuffer.slice(i, i + 6));
	}
	return {
		action: announceRes.readUInt32BE(0),
		transactionId: announceRes.readUInt32BE(4),
		interval: announceRes.readUInt32BE(8),
		leechers: announceRes.readUInt32BE(12),
		seeders: announceRes.readUInt32BE(16),
		peers: addresses.map(address => {
			return {
				ip: address.slice(0, 4).join('.'),
				port: address.readUInt16BE(4)
			};
		})
	};
}

function printRes(parsedMsg, rinfo) {
	console.log(`Socket got: ${JSON.stringify(parsedMsg)} from ${rinfo.address}:${rinfo.port}\n`);
}
