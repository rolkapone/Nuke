@echo off

set "source=C:\Users\Carol\Downloads\"
set "destination=C:\Users\Carol\Downloads\destination" 
mkdir %destination%
robocopy %source% %destination% *.png