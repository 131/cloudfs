
sc create mount_drives binPath= "%cd%\drive.exe" start= auto
sc failure mount_drives reset= 30 actions= restart/1000
