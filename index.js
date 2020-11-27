"use strict";

const fs   = require('fs');
const path = require('path');
const EventEmitter = require('events');

const Tray = require('trayicon');
const ocn  = require('on-change-network');

const writeSync = require('nyks/fs/writeLazySafeSync');

const SshFS = require('./libs/sshfs');

const SETTINGS_PATH = path.join(process.env.USERPROFILE, '.config', 'drives/drives.json');

class DriveCtl extends EventEmitter {


  constructor() {
    super();

    this.drives = [];
    ocn(() => this.emit('ocn'));
  }

  register(drive) {
    this.on('ocn', () => drive.emit("ocn"));

    drive.on('notify', this.notify.bind(this, drive.config.name));
    drive.on('status_update', this.updateMenu.bind(this));
    drive.on('config_update', this.saveSettings.bind(this));

    this.drives.push(drive);
    if(drive.config.automount)
      drive.mount();
  }

  updateMenu() {
    let menu = [];
    for(let drive of this.drives)
      menu.push(drive.menu(this.tray));

    this.tray.setMenu(...menu);
  }

  notify(title, msg) {
    this.tray.notify(title, msg);
  }

  saveSettings() {
    let settings = [];
    for(let drive of this.drives)
      settings.push(drive.config);

    writeSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
  }

  async registerService(){
    //sc create mount_drives binPath= %cd%\drive.exe start= auto
    //sc failure mount_drives reset= 30 actions= restart/1000
  }

  async run() {
    this.tray = await Tray.create({
      title : "foo de bar",
    });

    var drives = [];
    try {
      drives = JSON.parse(fs.readFileSync(SETTINGS_PATH));
    } catch(err) {console.error(err);};


    for(let config of drives) {
      let drive;
      if(config.driver == "sshfs")
        drive = new SshFS(config);

      this.register(drive)
    }

    this.updateMenu();

  }


}

module.exports = DriveCtl;
