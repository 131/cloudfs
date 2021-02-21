
sc create winfsp-tray binPath= "%~dp0%\drive.exe" start= auto
sc failure winfsp-tray reset= 30 actions= restart/1000
