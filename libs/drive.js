"use strict";

const EventEmitter = require('events');

const defer  = require('nyks/promise/defer');
const wait   = require('nyks/child_process/wait');
const sleep  = require('nyks/async/sleep');


class Drive extends EventEmitter {

  constructor() {
    super();
    this.status = "unknown";
  }

  spawn() {
    throw `Not implemented`;
  }

  async mount() {
    if(this.mounted)
      return;

    this.mounted = true;

    var delay   = 1000;
    var ocn_trigger = defer();

    //re-init state on network change
    this.on('ocn', () => {
      ocn_trigger.resolve();
      ocn_trigger = defer(); //re-create
      delay   = 1000;
    });

    do {
      this.status = "mounting";

      this.child = this.spawn();
      this.status = "currently mounted";
      await wait(this.child);

      this.status = "currently unmounted";

      if(this.mounted) {
        await Promise.race([sleep(delay), ocn_trigger]);
        delay *= 2;
      } else {
        this.notify("Re-connecting drive");
      }
      //process as crashed, wait

    } while(this.mounted);
  }

  toggleAuto() {
    this.config.automount = !this.config.automount;
    this.emit('status_update');
    this.emit('config_update');
  }

  unmout() {
    this.mounted = false;
    this.child.kill();
    this.notify("Unmounted");
  }

  menu(tray) {

    let i = tray.item(this.name, {bold : true});

    let action = this.mounted
      ? tray.item("Unmount volume", {action : this.unmount.bind(this)})
      : tray.item("Mount volume", {action : this.mount.bind(this)});

    i.add(tray.item(this.status, {disabled : true}), action);

    i.add(tray.item("Automount volume", {checked : this.config.automount, action : this.toggleAuto.bind(this)}));
    return i;
  }

}

module.exports = Drive;
