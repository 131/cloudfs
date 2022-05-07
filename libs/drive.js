"use strict";

const EventEmitter = require('events');


const consts = {
  STATUS_UNKNOWN  : "(unknown)",
  STATUS_MOUNTING : "mounting",
  STATUS_MOUNTED  : "currently mounted",
  STATUS_REMOUNTING : "Waiting for remount",

  STATUS_UNMOUNTED  : "currently unmounted",
  STATUS_UNMOUNTING : "(waiting for unmount)",
};

class Drive extends EventEmitter {

  constructor(config) {
    super();
    this.config = config;
    this._statusMsg = consts.STATUS_UNKNOWN;
  }


  setStatus(msg) {
    this._statusMsg = msg;
    this.emit('status_update');
  }

  spawn() {
    throw `Not implemented`;
  }

  async mount() {
    throw `Not implemented`;
  }

  toggleAuto() {
    this.config.automount = !this.config.automount;
    this.emit('status_update');
    this.emit('config_update');
  }

  unmount() {
    throw `Not implemented`;
  }

  menu(tray) {
    let title = `${this.config.mount} (${this.config.name})`;
    let i = tray.item(title);

    i.add(tray.item(this._statusMsg, {disabled : true}));

    if(this.mounted)
      i.add(tray.item("Unmount volume", {action : this.unmount.bind(this)}));
    else
      i.add(tray.item("Mount volume", {action : this.mount.bind(this)}));

    i.add(tray.item("Automount volume", {checked : this.config.automount, action : this.toggleAuto.bind(this)}));
    return i;
  }

  static factory(config) {
    let SshFS = require('./sshfs');

    if(config.driver == "sshfs")
      return new SshFS(config);

    let Cloudfs = require('./cloudfs');

    if(config.driver == "cloudfs")
      return new Cloudfs(config);

  }

}

Drive.consts = consts;
module.exports = Drive;
