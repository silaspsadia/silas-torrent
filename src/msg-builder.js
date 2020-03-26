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
