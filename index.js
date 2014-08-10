var exec = require('child_process').exec;
var path  = require('path');
var fs    = require('fs');

String.prototype.supplant = function (o) {
  return this.replace(/{([^{}]*)}/g,
    function (a, b) {
      var r = o[b];
      return typeof r === 'string' || typeof r === 'number' ? r : a;
    });
};

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
  'zip --recurse-paths --quiet --password {password} {zipfile} {basename}',
  'mv {zipfile} ~/',
  'cd ~-'
].join(' && ').supplant({
  dirname:  dirname,
  password: password,
  zipfile:  zipfile,
  basename: basename
});

console.log('Compressing...');
console.log(command);
console.log('Compressing done...');

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

console.log('Uploading...');
console.log(command);
console.log('Uploading done...');

// Print download info
console.log('\n=== Downloading information ===');
command = [
  'scp {user}@{host}:{folder}/{zipfile} ~/Downloads/',
  'unzip -p {password} {zipfile}',
  'rm -rf {zipfile}'
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
