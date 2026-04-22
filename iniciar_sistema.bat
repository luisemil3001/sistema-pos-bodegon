@echo off
title SISTEMA POS - BODEGON LA PARED
cls
echo ====================================================
echo   INICIANDO SISTEMA BODEGON LA PARED
echo ====================================================
echo.

echo [1/2] Iniciando Servidor de Datos...
cd billing-api
start /B node index.js > nul
echo ✅ Servidor ejecutandose en segundo plano.
echo.

echo [2/2] Abriendo Interfaz de Ventas...
echo (Espere unos segundos para conectar...)
cd ..
timeout /t 5 /nobreak > nul
npm start
echo.
echo ====================================================
echo   SISTEMA CERRADO
echo ====================================================
exit