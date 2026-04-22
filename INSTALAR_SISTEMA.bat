@echo off
title INSTALADOR - SISTEMA BODEGON LA PARED
cls
echo ====================================================
echo   SISTEMA DE FACTURACION - BODEGON LA PARED
echo   ASISTENTE DE INSTALACION
echo ====================================================
echo.
echo Verificando dependencias...
echo.

node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] No se encontro Node.js instalado.
    echo Por favor descargue e instale Node.js desde https://nodejs.org/
    pause
    exit
)

echo [1/2] Instalando paquetes base del servidor...
cd billing-api
call npm install --omit=dev
echo.

echo [2/2] Configurando la Base de Datos...
node setup-cliente.js
echo.

echo ====================================================
echo Puedes cerrar esta ventana e iniciar la aplicacion.
echo ====================================================
pause