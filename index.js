var express = require('express');
var hmsearch = require('hmsearch');
var request = require('request');
var pHash = require("phash");
var tmp = require("tmp");
var fs = require("fs");
var app = express();

DB_PATH = "/data/hashes.kch";
BITS_PER_HASH = 64;

var db;
try {
  db = hmsearch.openSync(DB_PATH, hmsearch.READWRITE);
} catch (e) {
  console.log("cant open db, trying to init it first, e=" + e);
  hmsearch.initSync(DB_PATH, BITS_PER_HASH, 7, 1000000);
  db = hmsearch.openSync(DB_PATH, hmsearch.READWRITE);
}

function get_image_blockhash(image_url, cb) {
  tmp.file({keep: true}, function(err, path, fd, cleanup) {
    try {
      if (err) throw err;
      request(image_url)
        .pipe(fs.createWriteStream(path))
        .on('finish', function(s) {
          pHash.imageHash(path, function(err, hash) {
            cleanup();
            if (err) {
              cb(err, null);
            } else {
              // weirdly, hash is string containing integer
              var int_hash = parseInt(hash);
              var hex_hash = ("000000000000000" + int_hash.toString(16)).substr(-16);
              console.log("hex_hash=" + hex_hash);
              cb(null, hex_hash);
            }
          });
        })
        .on('error', function(e) {
          cleanup();
          cb(e, null);
        });
    } 
    catch (e) {
      cleanup();
      cb(e, null);
    }
  });
}

app.get('/lookup', function (req, res) {
  var image_url = req.query.image_url;
  console.log("lookup, image_url=" + image_url);

  get_image_blockhash(image_url, function(err, image_hash) {
    if (err) {
      res.sendStatus(500);
    } else {
      db.lookup(image_hash, function(err, lookup_result) {
        if (err) {
          console.log("lookup error=" + err);
          res.sendStatus(501);
        } else {
          res.json({
            image_hash: image_hash,
            lookup_result: lookup_result.map(function(it) {
              return {
                image_hash: it.hash,
                distance: it.distance / BITS_PER_HASH,
              };
            })
          });
        }
      });
    }
  });
});

app.put('/insert', function (req, res) {
  var image_url = req.query.image_url;
  console.log("insert, image_url=" + image_url);

  get_image_blockhash(image_url, function(err, image_hash) {
    if (err) {
      console.log("/insert, err=" + err);
      res.sendStatus(500);
    } else {
      db.insert(image_hash, function(err) {
        if (err) {
          console.log("insert hash, image_hash=" + image_hash + ", err=" + err);
          res.sendStatus(500);
        } else {
          res.json({
            image_hash: image_hash
          });
        }
      });
    }
  });
});

app.listen(3000, function () {
  console.log('app listening on port 3000!');
});
