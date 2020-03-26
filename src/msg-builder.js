const crypto = require('crypto');
const Buffer = require('buffer').Buffer;
const util = require('./util');

module.exports.buildConnectReq = () => {
	const buf = Buffer.alloc(16);
	buf.writeUInt32BE(0x417, 0); // 1st half connection_id
	buf.writeUInt32BE(0x27101980, 4); // 2nd half connection_id
	buf.writeUInt32BE(0x0, 8); // action (0 === Connect)
	crypto.randomBytes(4).copy(buf, 12); // transaction_id
	return buf;
}

module.exports.buildAnnounceReq = (connectionId, torrent, port=6881) => {
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

module.exports.buildHandshake = torrent => {
	const buf = Buffer.alloc(68);
	// pstrlen
	buf.writeUInt8(19, 0);
	// pstr
	buf.write('BitTorrent protocol', 1);
	// reserved
	buf.writeUInt32BE(0, 20);
	buf.writeUInt32BE(0, 24);
	// info hash
	torrent.infoHash.copy(buf, 28);
	// peer id
	util.genId().copy(buf, 48);
	return buf;
};

module.exports.buildKeepAlive = () => Buffer.alloc(4);

module.exports.buildChoke = () => {
	const buf = Buffer.alloc(5);
	// length
	buf.writeUInt32BE(1, 0);
	// id
	buf.writeUInt8(0, 4);
	return buf;
};

module.exports.buildUnchoke = () => {
	const buf = Buffer.alloc(5);
	// length
 	buf.writeUInt32BE(1, 0);
	// id
	buf.writeUInt8(1, 4);
	return buf;
};

module.exports.buildInterested = () => {
	const buf = Buffer.alloc(5);
	// length
	buf.writeUInt32BE(1, 0);
	// id
	buf.writeUInt8(2, 4);
	return buf;
};

module.exports.buildUninterested = () => {
	const buf = Buffer.alloc(5);
	// length
	buf.writeUInt32BE(1, 0);
 	// id
	buf.writeUInt8(3, 4);
	return buf;
};

module.exports.buildHave = payload => {
	const buf = Buffer.alloc(9);
	// length
	buf.writeUInt32BE(5, 0);
	// id
	buf.writeUInt8(4, 4);
	// piece index
	buf.writeUInt32BE(payload, 5);
	return buf;
};

module.exports.buildBitfield = bitfield => {
	const buf = Buffer.alloc(14);
	// length
	buf.writeUInt32BE(payload.length + 1, 0);
	// id
	buf.writeUInt8(5, 4);
	// bitfield
	bitfield.copy(buf, 5);
	return buf;
};

module.exports.buildRequest = payload => {
	const buf = Buffer.alloc(17);
	// length
	buf.writeUInt32BE(13, 0);
	// id
	buf.writeUInt8(6, 4);
	// piece index
	buf.writeUInt32BE(payload.index, 5);
	// begin
	buf.writeUInt32BE(payload.begin, 9);
	// length
	buf.writeUInt32BE(payload.length, 13);
	return buf;
};

module.exports.buildPiece = payload => {
	const buf = Buffer.alloc(payload.block.length + 13);
	// length
	buf.writeUInt32BE(payload.block.length + 9, 0);
	// id
	buf.writeUInt8(7, 4);
	// piece index
	buf.writeUInt32BE(payload.index, 5);
	// begin
	buf.writeUInt32BE(payload.begin, 9);
	// block
	payload.block.copy(buf, 13);
	return buf;
};

module.exports.buildCancel = payload => {
	const buf = Buffer.alloc(17);
	// length
	buf.writeUInt32BE(13, 0);
	// id
	buf.writeUInt8(8, 4);
	// piece index
	buf.writeUInt32BE(payload.index, 5);
	// begin
	buf.writeUInt32BE(payload.begin, 9);
	// length
	buf.writeUInt32BE(payload.length, 13);
	return buf;
};

// For use with DHT tracker
module.exports.buildPort = payload => {
	const buf = Buffer.alloc(7);
	// length
	buf.writeUInt32BE(3, 0);
	// id
	buf.writeUInt8(9, 4);
	// listen-port
	buf.writeUInt16BE(payload, 5);
	return buf;
};
