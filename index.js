var exec  = require('child_process').exec;
var path  = require('path');
var fs    = require('fs');
var async = require('async');

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
Commander.prototype.run = function () {

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

  async.series(commands);
};

var commands = new Commander();

var host = 'vkplayer.valeriivasin.com';
var user   = 'root';
var folder = '~/files';

if ( process.argv.length < 3 ) {
  throw new Error('You should provide filename as an argument.');
}

var filename = process.argv[2];

if ( !fs.existsSync(filename) ) {
  throw new Error('File does not exist.');
}

var filepath = path.relative('./', filename);
console.log('Relative filepath: %s', filepath);

// file/folder name
var basename = path.basename(filepath);

// directory file/folder is located in
var dirname  = path.dirname(filepath);

var password = Math.random().toString(36).slice(2);
var zipfile  = Math.random().toString(36).slice(2) + '.zip';

var command;

// Create ZIP file
command = [
  'cd {dirname}',
  'zip --recurse-paths --password {password} {zipfile} {basename}',
  'mv {zipfile} ~/',
  'cd ~-'
].join(' && ').supplant({
  dirname:  dirname,
  password: password,
  zipfile:  zipfile,
  basename: basename
});

commands.add({
  before:  console.log.bind(console, 'Compressing...'),
  after:   console.log.bind(console, 'Compressing done...'),
  command: command
});

// Upload it to the server
command = [
  'scp ~/{zipfile} {user}@{host}:{folder}/',
  'rm -rf ~/{zipfile}'
].join(' && ').supplant({
  zipfile: zipfile,
  user:    user,
  host:    host,
  folder:  folder
});

commands.add({
  before:  console.log.bind(console, 'Uploading...'),
  after:   function () {
    console.log('Uploading done...');
    printInfo();
  },
  command: command
});

commands.run();

function printInfo() {
  // Print download info
  console.log('\n=== Downloading information ===');
  command = [
    'scp {user}@{host}:{folder}/{zipfile} ~/Downloads/',
    'cd ~/Downloads/',
    'unzip -n -P {password} {zipfile}',
    'rm -rf {zipfile}',
    'cd ~-'
  ].join(' && ').supplant({
    user:     user,
    host:     host,
    folder:   folder,
    zipfile:  zipfile,
    password: password
  });
  console.log(command);
  console.log('===============================');

  // Print server cleanup info
  console.log('\n=== Cleanup after download ===');
  command = 'ssh {user}@{host} "rm -rf {folder}/{zipfile}"'.supplant({
    user:    user,
    host:    host,
    folder:  folder,
    zipfile: zipfile
  });
  console.log(command);
  console.log('================================');
}
