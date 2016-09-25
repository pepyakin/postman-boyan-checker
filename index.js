var express = require('express');
var hmsearch = require('hmsearch');
var request = require('request');
var blockhash = require('blockhash');
var getPixels = require("get-pixels");
var app = express();

DB_PATH = "/data/hashes.kch";

var db;
try {
  db = hmsearch.openSync(DB_PATH, hmsearch.READWRITE);
} catch (e) {
  console.log("cant open db, trying to init it first, e=" + e);
  hmsearch.initSync(DB_PATH, 256, 10, 1000000);
  db = hmsearch.openSync(DB_PATH, hmsearch.READWRITE);
}

function get_image_blockhash(image_url, cb) {
  getPixels(image_url, function(pixels_err, pixels) {
    if (pixels_err) {
      cb(pixels_err, null);
    } else {
      var image_data = {
        width: pixels.shape[0],
        height: pixels.shape[1],
        data: pixels.data
      };
      try {
        var image_hash = blockhash.blockhashData(image_data, 16, 1);
        console.log("image_hash=" + image_hash);
        cb(null, image_hash);
      } catch (e) {
        cb(e, null);
      }
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
            lookup_result: lookup_result
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
      res.sendStatus(500);
    } else {
      db.insert(image_hash, function(err) {
        if (err) {
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
