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
  hmsearch.initSync(DB_PATH, 256, 5, 1000000);
  db = hmsearch.openSync(DB_PATH, hmsearch.READWRITE);
}

app.get('/lookup', function (req, res, next) {
  var image_url = req.query.image_url;
  console.log("image_url=" + image_url);

  getPixels(image_url, function(pixels_err, pixels) {
    if (pixels_err) {
      res.send(500);
    } else {
      var image_data = {
        width: pixels.shape[0],
        height: pixels.shape[1],
        data: pixels.data
      };
      var image_hash = blockhash.blockhashData(image_data, 16, 1);
      console.log("image_hash=" + image_hash);
      db.lookup(image_hash, function(err, lookup_result) {
        if (err) {
          console.log("lookup error=" + err);
          res.send(501);
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

app.listen(3000, function () {
  console.log('app listening on port 3000!');
});
