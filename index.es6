let fs = require('fs');
let path = require('path');
let exec = require('child_process').exec;

class Commands {
  constructor(options) {
    this.commands = [];
    this.options = options;
  }

  add(command) {
    this.commands.push(command);

    if (this.options.debug) {
      console.log('[CMD] %s', command);
    }
  }

  run(callback) {
    if (this.options.debug) {
      callback();
      return;
    }

    let child = exec(this.commands.join(' && '), callback);

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

    this.commands = [];
  }
}

class Encoder {

  /**
   * @param  {String} filename Full path to file
   * @param {Object} [options.debug] Debug flag: will not execute commands and
   *                                 print all info
   */
  constructor(filename, options) {

    // turn on `cleanup` and `upload` option if they not provided
    if (typeof options.cleanup === 'undefined') {
      options.cleanup = true;
    }

    if (typeof options.upload === 'undefined') {
      options.upload = true;
    }

    this.options = options;

    // determine file full path
    if (filename.charAt(0) !== path.sep) {
      filename = path.join(process.cwd(), filename);
    }

    if (options.debug) {
      console.log('Options: ', options);
      console.log('Full file path: %s', filename);
    }

    this.cmd = new Commands({ debug: options.debug });

    let TMP_PATH = path.join(__dirname, '.tmp');

    // full path to zip file
    let zipfile = path.join(TMP_PATH, `${this._randomString()}.tar`);

    // full path to encoded zip file
    let binfile = zipfile + '.bin';

    this.config = { filename, zipfile, binfile };
  }

  start() {
    this.zip();
    this.encode();

    if (this.options.upload) {
      this.upload()
    }

    if (this.options.cleanup) {
      this.cleanup()
    }

    this.cmd.run(this.printInfo.bind(this));
  }

  _randomString() {
    return Math.random().toString(36).slice(2);
  }

  zip() {
    let filename = this.config.filename;
    let file = path.basename(filename);
    let dir = path.dirname(filename);

    this.cmd.add(`cd ${dir}`);
    this.cmd.add(`tar -cvf ${this.config.zipfile} ${file}`);

    return this;
  }

  encode() {
    this.config.OPENSSL_PASSWORD = this._randomString();

    this.cmd.add(`openssl enc -e -des3 -salt -in ${this.config.zipfile} -out ${this.config.binfile} -pass pass:${this.config.OPENSSL_PASSWORD}`)
    return this;
  }

  upload() {
    this.SERVER_CONFIG = require('./config');
    this.cmd.add(`scp ${this.config.binfile} ${this.SERVER_CONFIG.user}@${this.SERVER_CONFIG.host}:${this.SERVER_CONFIG.folder}/`);
    return this;
  }

  cleanup() {
    this.cmd.add(`rm -rf ${this.config.zipfile}`);

    // remove resulting file only if it was uploaded before
    if (this.options.upload) {
      this.cmd.add(`rm -rf ${this.config.binfile}`);
    }

    return this;
  }

  printInfo() {
    if (this.options.upload) {
      this._printDownloadInfo();
    } else {
      this._printEncodeInfo();
    }

    return this;
  }

  _printEncodeInfo() {
    let binfile = path.basename(this.config.binfile);
    let zipfile = path.basename(this.config.zipfile);

    console.log(`
=== Encoding information ===
# Encoded file: ${this.config.binfile}
openssl enc -d -des3 -in ${binfile} -out ${zipfile} -pass pass:${this.config.OPENSSL_PASSWORD}
tar -xvf ${zipfile}
    `);
  }

  _printDownloadInfo() {
    let binfile = path.basename(this.config.binfile);
    let zipfile = path.basename(this.config.zipfile);

    console.log(`
=== Downloading and encoding information ===
scp ${this.SERVER_CONFIG.user}@${this.SERVER_CONFIG.host}:${this.SERVER_CONFIG.folder}/${binfile} ~/Downloads/
cd ~/Downloads/
openssl enc -d -des3 -in ${binfile} -out ${zipfile} -pass pass:${this.config.OPENSSL_PASSWORD}
rm -rf ${binfile}
tar -xvf ${zipfile}
rm -rf ${zipfile}
cd ~-
    `);
  }
}

module.exports = Encoder;
