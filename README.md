# About

Share your *secret* files with someone through your own server.

`Uploader` will help you to pack and encrypt your files, upload the archive to yours remote host via `scp` and provide information how could it be downloaded it.

# Options
* `--no-upload` - do not perform upload
* `--no-cleanup` - do not perform cleanup (remove .tar/.tar.bin files)
* `--debug` - do not perform any command - just see result commands and additional logs

# How to use

```bash
# clone the repo and instal dependencies
git clone git@github.com:ValeriiVasin/uploader.git
cd uploader/
npm install

# copy config and edit it
cp config.example.js config.js
vim config.js

# upload you file to the server
node ./index ~/Documents/share-my.mp4
```

You will see the log like...
```bash
Relative filepath: ../../share-my.mp4
Compressing...
cd ../.. && tar -cvf snum70kda69cz0k9.tar yp.mp4 && mv snum70kda69cz0k9.tar ~/ || true && cd ~-
a share-my.mp4
Compressing: 3140ms
Encoding...
openssl enc -e -des3 -salt -in ~/snum70kda69cz0k9.tar -out ~/snum70kda69cz0k9.tar.bin -pass pass:349jek4btkkgwrk9 && rm -rf ~/snum70kda69cz0k9.tar
Encoding: 9992ms
Uploading...
scp ~/snum70kda69cz0k9.tar.bin user@files.yourserver.com:~/files/ && rm -rf ~/snum70kda69cz0k9.tar.bin
Uploading: 34689ms

=== Downloading information ===
scp user@files.yourserver.com:~/files/snum70kda69cz0k9.tar.bin ~/Downloads/ && cd ~/Downloads/ && openssl enc -d -des3 -in snum70kda69cz0k9.tar.bin -out snum70kda69cz0k9.tar -pass pass:349jek4btkkgwrk9 && rm -rf snum70kda69cz0k9.tar.bin && tar -xvf snum70kda69cz0k9.tar && rm -rf snum70kda69cz0k9.tar && cd ~- && ssh user@files.yourserver.com "rm -rf ~/files/snum70kda69cz0k9.tar.bin"
===============================
```

# Important
Currently uploader relies on some OSX-specific folders. Maybe it will be configurable later.
