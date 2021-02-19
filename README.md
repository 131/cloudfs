# Description

[Winfsp-Tray](https://github.com/131/winfsp-tray) is simple tray (no gui) app to manage network drive and mountpoint.

It notifies you when drive are mounted / unmounted, and monitor network configuration change to trigger mount when possible.

# Motivation
Window network drive are a pain to deal with, once un-registered, you have to re-create a mountpoint. Nor does it notify you when a drive is available.
This is a nodejs application. Not an electron/nwjs weirdness as there is no GUI involded / required. Tray is handled by a [131/trayicon](https://github.com/131/trayicon), a **node module**.


# Supported drivers : sshfs
* Install winfsp
* Install sshfs-win


# Example configuration file %programdata%\drives\drives.json
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
# Roadmap
* Add NFS driver



# Advanced (service-mode)

As uses [131's dispatcher](https://github.com/131/dispatcher) under the hood. You can register it to run as NT_AUTHORITY service. (see dist/register_service.cmd)


# Credits
* [131](https://github.com/131)
* code signing, courtesy of IVS Group.
