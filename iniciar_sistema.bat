@echo off
cd /d "%~dp0"
title SISTEMA POS - BODEGON 
cls
echo ====================================================
echo   INICIANDO SISTEMA BODEGON 
echo ====================================================
echo.

echo [1/2] Iniciando Servidor de Datos...
cd /d "%~dp0billing-api"
start /B node index.js > nul 2>&1
echo    OK - Servidor ejecutandose en segundo plano.
echo.

echo [2/2] Abriendo Interfaz de Ventas...
echo (Espere unos segundos para conectar...)
cd /d "%~dp0"
timeout /t 4 /nobreak > nul
set NODE_ENV=production
npm start

echo.
echo ====================================================
echo   SISTEMA CERRADO
echo ====================================================
taskkill /f /im node.exe > nul 2>&1
exit