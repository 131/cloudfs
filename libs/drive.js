"use strict";

const fs     = require('fs');
const EventEmitter = require('events');

const defer  = require('nyks/promise/defer');
const wait   = require('nyks/child_process/wait');
const sleep  = require('nyks/async/sleep');


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

    if(this.mounted || this.child)
      return;


    this.mounted = true;

    var delay   = 1000;
    var ocn_trigger = defer();

    //re-init state on network change
    this.on('ocn', () => {
      console.log("Reset delay");
      ocn_trigger.resolve();
      ocn_trigger = defer(); //re-create
      delay   = 1000;
    });

    do {
      this.setStatus(consts.STATUS_MOUNTING);

      try {
        this.child = await this.spawn();
        (async (child) => {
          do {
            if(fs.existsSync(this.config.mount))
              break;
            if(child.exitCode !== null)
              return;
            await sleep(200);
          } while(true);
          this.setStatus(consts.STATUS_MOUNTED);
          this.emit("notify", "Mounted");
        })(this.child);

        await wait(this.child);
      } catch(err) {
        console.log("FAILURE MOUTING", err);
      }

      if(!this.mounted)
        break;

      this.setStatus(consts.STATUS_REMOUNTING);
      console.log("Sleeping", delay);
      await Promise.race([sleep(delay), ocn_trigger]);
      delay *= 2;

    } while(true);

    this.child = null;
  }

  toggleAuto() {
    this.config.automount = !this.config.automount;
    this.emit('status_update');
    this.emit('config_update');
  }

  unmount() {
    this.mounted = false;
    console.log("Ask for unmout");

    this.child.on('close', () => {
      this.child = null;
      this.setStatus(consts.STATUS_UNMOUNTED);

      this.emit("notify", "Unmounted");
    });

    this.setStatus(consts.STATUS_UNMOUNTING);
    this.child.kill();
  }

  menu(tray) {
    let title = `${this.config.mount} (${this.config.name})`;
    let i = tray.item(title);

    i.add(tray.item(this._statusMsg, {disabled : true}));

    if(this.mounted)
      i.add(tray.item("Unmount volume", {action : this.unmount.bind(this)}));
    else if(!this.child)
      i.add(tray.item("Mount volume", {action : this.mount.bind(this)}));


    i.add(tray.item("Automount volume", {checked : this.config.automount, action : this.toggleAuto.bind(this)}));
    return i;
  }

  static factory(config) {
    let SshFS = require('./sshfs');

    if(config.driver == "sshfs")
      return new SshFS(config);

  }

}

Drive.consts = consts;
module.exports = Drive;
