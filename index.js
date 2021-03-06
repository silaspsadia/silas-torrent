const bencode = require('bencode');
const urlParse = require('url').parse;
const fs = require('fs');
const dgram = require('dgram');
const crypto = require('crypto');
const Buffer = require('buffer').Buffer;
const util = require('./src/util');
const tracker = require('./src/tracker');
const msgBuilder = require('./src/msg-builder');
const download = require('./src/download');
const Torrent = require('./src/Torrent');

var torrent = new Torrent(bencode.decode(fs.readFileSync(process.argv[2])));
tracker.getPeers(torrent, peers => {
    peers.map(peer => {
        console.log(peer);
        download(peer, torrent);
    })
});
