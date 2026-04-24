@echo off
cd /d "%~dp0"
title CONFIGURADOR DE PUNTO DE VENTA - BODEGON LA PARED
cls
echo ====================================================
echo   INSTALADOR DE CAJA ADICIONAL - BODEGON LA PARED
echo   Versión 1.0 (Modo Red LAN)
echo ====================================================
echo.

node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] No se encontro Node.js. 
    echo Por favor instalelo primero desde https://nodejs.org/
    pause
    exit
)

echo [Paso 1/3] Instalando componentes de comunicacion y drivers...
cd billing-api
call npm install --omit=dev
echo.

echo [Paso 2/3] Ejecutando asistente de configuracion de red...
node setup-terminal.js
echo.

echo [Paso 3/3] Preparando interfaz de usuario...
cd ..
call npm install
echo.

echo ====================================================
echo   CONFIGURACION FINALIZADA
echo   IP del Servidor y Puertos guardados.
echo   
echo   Para iniciar el punto de venta use:
echo   iniciar_sistema.bat
echo ====================================================
pause
