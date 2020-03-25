const bencode = require('bencode');
const crypto = require('crypto');
const bignum = require('bignum');

module.exports.parse = torrent => {
  torrent.infoHash = calculateInfoHash(torrent);
  torrent.size = calculateSize(torrent);
  return torrent;
};

function calculateInfoHash(torrent) {
	const encodedInfo = bencode.encode(torrent.info);
	return crypto.createHash('sha1').update(encodedInfo).digest();
}

function calculateSize(torrent) {
	const size = torrent.info.files ?
		torrent.info.files.map(file => file.length).reduce((a, b) => a + b) :
		torrent.info.length;
  return bignum.toBuffer(size, {size: 8});
}