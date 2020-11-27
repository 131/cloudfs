"use strict";

const path  = require('path');
const {spawn} = require('child_process');

const wait = require('nyks/child_process/wait');
const drain = require('nyks/stream/drain');
const Drive = require('./drive');


const SSH_FS_WIN_DIR = 'C:\\Program Files\\SSHFS-Win\\bin';
const SSH_FS_PATH    = path.join(SSH_FS_WIN_DIR, 'sshfs.exe');
const WINFSP_DIR     = 'C:\\Program Files (x86)\\WinFsp\\bin';


class SshFS extends Drive {
  constructor(config) {
    super(config);
  }

  static async resolveOwner(username) {

    const FSPTOOL = path.join(WINFSP_DIR, 'fsptool-x64.exe');
    let child = spawn(FSPTOOL, ["id", username]);

    let [, body] = await Promise.all([wait(child), drain(child.stdout)]);

    let uidMatch = /\(uid=([0-9]+)\)/;
    if(uidMatch.test(body.toString()))
      return uidMatch.exec(body.toString())[1];
    throw `Cannot lookup user ${username} id`;
  }

  async _forgeCmdLine() {

    let {remote, owner} = this.config;
    var args = [];

    let uid = -1;
    let gid = -1;

    if(owner)
      uid = await SshFS.resolveOwner(owner);

    args.push(
      `${remote.user}@${remote.host}:${remote.path || ''}`,
      `W:`,
      `-p${remote.port || 22}`,
      `-ovolname=webtest-ivs`,
      `-oStrictHostKeyChecking=no`,
      `-oUserKnownHostsFile=/dev/null`,
      `-oidmap=user`,
      `-oumask=000`,
      `-o reconnect`,
      `-ouid=${uid}`,
      `-ogid=${gid}`,

      `-ocreate_umask=113`, //means chmod 775 in fusespace

      `-omax_readahead=1GB`,
      `-oallow_other`,
      `-olarge_read`,
      `-okernel_cache`,
      `-ofollow_symlinks`,

      `-oLogLevel=DEBUG3`,
      `-odebug`,

      `-oPreferredAuthentications=publickey`,
      `-oIdentityFile=${remote.keyfile}`,
    );

    return args;
  }

  async spawn() {
    if(!this._cmdLine)
      this._cmdLine = await this._forgeCmdLine();


    var child = spawn(SSH_FS_PATH, this._cmdLine, {env : {PATH:SSH_FS_WIN_DIR}});

    child.stderr.pipe(process.stderr);
    child.stdout.pipe(process.stderr);
    return child;
  }



}

module.exports = SshFS;
