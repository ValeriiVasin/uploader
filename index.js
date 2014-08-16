/**
 * Options
 *   --noupload - do not perform upload
 */

var exec  = require('child_process').exec;
var path  = require('path');
var fs    = require('fs');
var async = require('async');

var isUpload = true;

String.prototype.supplant = function (o) {
  return this.replace(/{([^{}]*)}/g,
    function (a, b) {
      var r = o[b];
      return typeof r === 'string' || typeof r === 'number' ? r : a;
    });
};

function Commander() {
  this._commands = [];
}

/**
 * Add command to execute
 * @param {Object}   opts          Command opts
 * @param {String}   opts.command  Command to execute
 * @param {Function} [opts.before] Function to execute before the command
 * @param {Function} [opts.after]  Function to execute after the command
 */
Commander.prototype.add = function (opts) {
  this._commands.push(opts);
};

/**
 * Run all saved commands
 */
Commander.prototype.run = function (callback) {

  // map for async
  var commands = this._commands.map(function (options) {
    return function (callback) {
      if ( typeof options.before === 'function' ) {
        options.before();
      }

      console.log(options.command);
      var child = exec(options.command, function (err) {
        if ( typeof options.after === 'function' ) {
          options.after();
        }

        callback(err);
      });

      child.stdout.pipe(process.stdout);
      child.stderr.pipe(process.stderr);
    };
  });

  async.series(commands, callback);
};

var commands = new Commander();

var config = require('./config');

if ( process.argv.length < 3 ) {
  throw new Error('You should provide filename as an argument.');
}

var filename = process.argv[2];

if ( !fs.existsSync(filename) ) {
  throw new Error('File does not exist.');
}

var filepath = path.relative('./', filename);
console.log('Relative filepath: %s', filepath);

if ( process.argv.length > 3 && process.argv[3] === '--noupload' ) {
  isUpload = false;
}

// file/folder name
config.basename = path.basename(filepath);

// directory file/folder is located in
config.dirname  = path.dirname(filepath);

config.opensslPassword = Math.random().toString(36).slice(2);

config.zipfile = Math.random().toString(36).slice(2) + '.tar';
config.binfile = config.zipfile + '.bin';

var command;

// Create ZIP file
command = [
  'cd {dirname}',
  'tar -cvf {zipfile} {basename}',
  'mv {zipfile} ~/ || true',
  'cd ~-'
].join(' && ').supplant(config);

commands.add({
  before: function () {
    console.log('Compressing...');
    console.time('Compressing');
  },
  after: console.timeEnd.bind(console, 'Compressing'),
  command: command
});

// Encode ZIP file
command = [
  'openssl enc -e -des3 -salt -in ~/{zipfile} -out ~/{binfile} -pass pass:{opensslPassword}',
  'rm -rf ~/{zipfile}'
].join(' && ').supplant(config);

commands.add({
  before: function () {
    console.log('Encoding...');
    console.time('Encoding');
  },
  after:   console.timeEnd.bind(console, 'Encoding'),
  command: command
});

// Upload it to the server
if ( isUpload ) {
  command = [
    'scp ~/{binfile} {user}@{host}:{folder}/',
    'rm -rf ~/{binfile}'
  ].join(' && ').supplant(config);

  commands.add({
    before: function () {
      console.log('Uploading...');
      console.time('Uploading');
    },
    after: function () {
      console.timeEnd('Uploading');
    },
    command: command
  });
}

commands.run(printInfo);

/**
 * @todo add pbcopy
 */
function printInfo() {
  // Print download and cleanup info
  console.log('\n=== Downloading information ===');
  command = [
    isUpload ? 'scp {user}@{host}:{folder}/{binfile} ~/Downloads/' : '',
    'cd ~/Downloads/',
    'openssl enc -d -des3 -in {binfile} -out {zipfile} -pass pass:{opensslPassword}',
    'rm -rf {binfile}',
    'tar -xvf {zipfile}',
    'rm -rf {zipfile}',
    'cd ~-',
    isUpload ? 'ssh {user}@{host} "rm -rf {folder}/{binfile}"' : ''
  ].filter(Boolean).join(' && ').supplant(config);
  console.log(command);
  console.log('===============================');
}
