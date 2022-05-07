
sc create cloudfs binPath= "%~dp0%\cloudfs.exe" start= auto
sc failure cloudfs reset= 30 actions= restart/1000
