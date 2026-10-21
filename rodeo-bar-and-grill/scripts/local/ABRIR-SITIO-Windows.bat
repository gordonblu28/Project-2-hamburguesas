@echo off
rem Abre el sitio de The Rodeo en su navegador (Windows). Cierre la ventana negra para detenerlo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor.ps1"
if errorlevel 1 pause
