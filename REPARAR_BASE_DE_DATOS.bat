@echo off
cd /d "%~dp0"
title REPARACION DE BASE DE DATOS - BODEGON LA PARED
cls
echo ====================================================
echo   REPARACION DE BASE DE DATOS
echo   BODEGON LA PARED
echo ====================================================
echo.
echo Ejecutando reparacion automatica...
echo.
cd /d "%~dp0billing-api"
node REPARAR_BD.js
echo.
pause
