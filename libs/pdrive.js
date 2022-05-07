"use strict";

const fs     = require('fs');

const defer  = require('nyks/promise/defer');
const wait   = require('nyks/child_process/wait');
const sleep  = require('nyks/async/sleep');



const Drive = require('./drive');
const consts = Drive.consts;

class PDrive extends Drive {


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



  unmount() {
    this.mounted = false;
    console.log("Unmounting " + this.constructor.name);

    let done = () => {
      this.child = null;
      this.setStatus(consts.STATUS_UNMOUNTED);

      this.emit("notify", "Unmounted");
    };

    this.setStatus(consts.STATUS_UNMOUNTING);

    if(!this.child)
      return done();

    this.child.on('close', done);
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


}

module.exports = PDrive;
