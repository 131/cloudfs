"use strict";


const Drive = require('./drive');
const consts = Drive.consts;

const SContext = require('swift/context');
const Sqlfs    = require('sqlitefs');
const Cloudfs  = require('libcloudfs');



class CloudfsDrive extends Drive {
  constructor(config) {
    super(config);

    this.cloudfs = null;
    this.inodes  = null;
  }

  async mount() {

    if(this.mounted)
      return;

    this.mounted = true;
    this.setStatus(consts.STATUS_MOUNTING);


    let {
      mount,
      remote : {
        storage_creds, storage_container,
        inodes_creds, inodes_container, inodes_name
      },
      readonly,
    } = this.config;

    const options = {
      "ro" : readonly
    };



    let storage_ctx = await SContext.build(storage_creds);

    let inode_conf = {
      backend  : {
        type     : 'swift',
        ctx      : await SContext.build(inodes_creds),
      },
      container : inodes_container,
      filename  : inodes_name || 'index.sqlite',
    };

    this.inodes = new Sqlfs(inode_conf);

    console.log("Warmup sqlfs");
    await this.inodes.warmup();

    console.log("sqlfs is ready, starting cloudfs");
    this.cloudfs = new Cloudfs(this.inodes, storage_ctx, storage_container, options);

    await this.cloudfs.mount(mount);
    this.setStatus(consts.STATUS_MOUNTED);

    process.on('SIGINT', () => {
      console.log('Received SIGINT. Press Control-D to exit.');
    });

  }

  async unmount() {
    this.mounted = false;
    console.log("Unmounting cloudfs");

    this.setStatus(consts.STATUS_UNMOUNTING);

    if(this.inodes)
      await this.inodes.close();

    if(this.cloudfs)
      await this.cloudfs.close();

    this.setStatus(consts.STATUS_UNMOUNTED);
    this.emit("notify", "Unmounted");

  }


}

module.exports = CloudfsDrive;
