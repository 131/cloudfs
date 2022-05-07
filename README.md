[![Build Status](https://github.com/131/cloudfs/actions/workflows/deploy.yml/badge.svg?branch=master)](https://github.com/131/cloudfs/actions/workflows/deploy.yml)
[![Version](https://img.shields.io/github/v/release/131/cloudfs)](https://github.com/131/cloudfs/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](http://opensource.org/licenses/MIT)
![Available platform](https://img.shields.io/badge/platform-win32-blue.svg)


# Motivation
Unlimited drive.

Cloudfs is a standalone, lightweight, windows desktop application. It will register itself in system tray and run as background app.
Not an electron/nwjs weirdness as there is no GUI involded / required. Tray is handled by a [131/trayicon](https://github.com/131/trayicon), a **node module**.

cloudfs main backend is libcloudfs, a **file system** that stores all its data in the cloud. libcloudfs store file contents in a [CAS designed](https://github.com/131/casfs) cloud object storage backend [openstack swift](https://developer.openstack.org/api-ref/object-store/) and files metadata (inode table) in an [SQLlite database](https://github.com/131/sqlfs).


# Description
[cloudfs](https://github.com/131/cloudfs) is simple windows app to manage network drive and mountpoint.
It supports multiple storage backends and mountpoints, notifies you when drives are mounted / unmounted, and monitor network configuration change to trigger mount when possible.

# Download
# Installation
* Download and install [WinFsp](http://www.secfs.net/winfsp/download/)
* Download and install [cloudfs (available through github releases)](https://github.com/131/cloudfs/releases)
* Write configuration file in %LOCALAPPDATA%\Cloudfs\config\config.json (no documentation available for now)
* Enjoy !



# Project structure
[cloudfs](https://github.com/131/cloudfs) is designed around simplicity.
* The [libcloudfs](https://github.com/131/libcloudfs) main driver
* An isolated inode management API (see [sqlfs](https://github.com/131/sqlfs))
* A [fuse bindings](https://github.com/mafintosh/fuse-bindings) interface
* A battle tested [casfs](https://github.com/131/casfs) backend, to challenge implementation, confirm design and stress
* An openstack/[swift](https://github.com/131/swift) driver


# Supported drivers : libcloudfs, sshfs
* For sshfs, please install install sshfs-win


# Example configuration file %programdata%\cloudfs\config.json
```
[
  {
    "driver": "sshfs",
    "mount": "W:",
    "name": "[somename]",
    "remote": {
      "user": "[username]",
      "host": "[some ip]",
      "keyfile": "[private key rsa path]"
    },
    "owner": "[username]",
    "automount": true
  }
]
```



# Advanced (service-mode)
As uses [131's dispatcher](https://github.com/131/dispatcher) under the hood. You can register it to run as NT_AUTHORITY service. (see dist/register_service.cmd)


# Credits
* [131](https://github.com/131)
* code signing, courtesy of IVS Group.
