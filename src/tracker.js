const urlParse = require('url').parse;
const fs = require('fs');
const dgram = require('dgram');
const crypto = require('crypto');
const Buffer = require('buffer').Buffer;
const util = require('./util');
const msgBuilder = require('./msg-builder');

const MessageType = {
	CONNECT: 0,
	ANNOUNCE: 1
};

module.exports.getPeers = (torrent) => {
	var trackerUrl = torrent.announce.toString('utf8');
	var socket = dgram.createSocket('udp4');
	var connectReq = msgBuilder.buildConnectReq();
	
	sendUdpMessage(socket, connectReq, trackerUrl);

	socket.on('error', (err) => {
		console.log(`Socket error:\n${err.stack}`);
		socket.close();
	});

	socket.on('message', (msg, rinfo) => {
		if (respType(msg) == MessageType.CONNECT) {
			printRes(parseConnectRes(msg), rinfo);
			const connectRes = parseConnectRes(msg);
			const announceReq = msgBuilder.buildAnnounceReq(connectRes.connectionId, torrent);
			sendUdpMessage(socket, announceReq, trackerUrl);
		} else if (respType(msg) == MessageType.ANNOUNCE) {
			printRes(parseAnnounceRes(msg), rinfo);
			const announceRes = parseAnnounceRes(msg);
			return announceRes.peers
		}	
	});
}

function respType(msg) {
	return msg.readUInt32BE(0);
}

function sendUdpMessage(socket, msg, rawUrl, callback=()=>{}) {
	const url = urlParse(rawUrl);
	console.log('Sent message to url ' + url.href + ': ' + msg.inspect() + '\n');
	socket.send(msg, 0, msg.length, url.port, url.hostname, callback);
}

function parseConnectRes(connectRes) {
	return {
		action: connectRes.readUInt32BE(0),
		transactionId: connectRes.readUInt32BE(4),
		connectionId: connectRes.slice(8)
	};
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
