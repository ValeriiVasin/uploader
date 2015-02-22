/**
 * node index index.js --no-upload --no-cleanup --debug
 */

var minimist = require('minimist');

require('babel/register');
var Encoder = require('./index.es6');

// node uploader index.js --upload
var filename = process.argv[2];
var argv = minimist(process.argv.slice(3));

// DEPRECATED
// support previously used --noupload option
if (argv.noupload) {
  argv.upload = false;
}

// Notice: minimist automaticly parse --no-upload as {upload: false}
var encoder = new Encoder(filename, {
  debug: argv.debug,
  cleanup: argv.cleanup,
  upload: argv.upload
});

encoder.start();
