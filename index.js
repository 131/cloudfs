"use strict";

const fs   = require('fs');
const path = require('path');
const EventEmitter = require('events');

const sip   = require('single-instance-process');
const Tray = require('trayicon');
const ocn  = require('on-change-network');

const writeSync = require('nyks/fs/writeLazySafeSync');

const Drive = require('./libs/drive');

const SETTINGS_PATH = path.join(process.env.ProgramData, 'cloudfs/config.json');
const ICON_DEFAULT  = fs.readFileSync(path.join(__dirname, 'rsrcs/harddisk_network_information.png'));
const ICON_ALL      = fs.readFileSync(path.join(__dirname, 'rsrcs/harddisk_network.png'));

const {spawn} = require('child_process');
const meta    = require('./package.json');


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

    menu.push(this.tray.item(`${meta.name} v${meta.version}`, { disabled : true }));
    menu.push(this.tray.separator());

    let allMounted = true;

    for(let drive of this.drives) {
      allMounted &= (drive._statusMsg == Drive.consts.STATUS_MOUNTED || drive._statusMsg == Drive.consts.STATUS_UNMOUNTED);
      menu.push(drive.menu(this.tray));
    }

    let icon = allMounted ? ICON_ALL : ICON_DEFAULT;
    this.tray.setIcon(icon);

    menu.push(this.tray.separator());

    menu.push(this.tray.item("Open configuration file", function() {
      spawn("notepad.exe", [SETTINGS_PATH]);
    }));

    if(!('DISPATCHED_SERVICE_MODE' in process.env)) {
      menu.push(this.tray.separator());
      menu.push(this.tray.item("Quit", this.quit.bind(this)));
    }

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

    let is_server = await sip(`${meta.name} instance`, (payload) => {
      process.emit('openArgs', payload);
    });

    if(!is_server)
      process.exit();



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
