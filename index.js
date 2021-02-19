"use strict";

const fs   = require('fs');
const path = require('path');
const EventEmitter = require('events');

const Tray = require('trayicon');
const ocn  = require('on-change-network');

const writeSync = require('nyks/fs/writeLazySafeSync');

const Drive = require('./libs/drive');

const SETTINGS_PATH = path.join(process.env.ProgramData, 'drives/drives.json');
const ICON_DEFAULT  = fs.readFileSync(path.join(__dirname, 'rsrcs/harddisk_network_information.png'));
const ICON_ALL      = fs.readFileSync(path.join(__dirname, 'rsrcs/harddisk_network.png'));


const isNtAuth = process.env.USERNAME == `${process.env.COMPUTERNAME}$`;

class DriveCtl extends EventEmitter {


  constructor() {
    super();
    console.log("INHERE");
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
    if(!this.tray)
      return;

    let menu = [];
    let allMounted = true;

    for(let drive of this.drives) {
      allMounted &= (drive._statusMsg == Drive.consts.STATUS_MOUNTED);
      menu.push(drive.menu(this.tray));
    }
    let icon = allMounted ? ICON_ALL : ICON_DEFAULT;
    this.tray.setIcon(icon);

    if(!isNtAuth)
      menu.push(this.tray.item("Quit", this.quit.bind(this)));

    this.tray.setMenu(...menu);
  }

  quit() {

    for(let drive of this.drives)
      drive.unmount();

    this.tray.kill();
  }

  notify(title, msg) {
    if(!this.tray)
      return;
    this.tray.notify(title, msg);
  }

  saveSettings() {
    let settings = [];
    for(let drive of this.drives)
      settings.push(drive.config);

    writeSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
  }


  async run() {

    var drives = [];
    try {
      drives = JSON.parse(fs.readFileSync(SETTINGS_PATH));
    } catch(err) {console.error(err);}


    this.tray = await Tray.create({
      title : `Drives (${drives.length})`,
      icon  : ICON_DEFAULT,
    });


    for(let config of drives) {
      let drive = Drive.factory(config);
      this.register(drive);
    }

    this.updateMenu();

  }


}

module.exports = DriveCtl;
