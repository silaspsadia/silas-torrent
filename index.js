const bencode = require('bencode');
const urlParse = require('url').parse;
const fs = require('fs');
const dgram = require('dgram');
const crypto = require('crypto');
const Buffer = require('buffer').Buffer;
const util = require('./src/util');
const tracker = require('./src/tracker');
const torrentParser = require('./src/torrent-parser');
const msgBuilder = require('./src/msg-builder');

var torrent = torrentParser.parse(bencode.decode(fs.readFileSync(process.argv[2])));
var peers = tracker.getPeers(torrent);
