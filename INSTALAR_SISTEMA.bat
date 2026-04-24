@echo off
cd /d "%~dp0"
title INSTALADOR - SISTEMA BODEGON 
cls
echo ====================================================
echo   SISTEMA DE FACTURACION - BODEGON LA PARED
echo   ASISTENTE DE INSTALACION PROFESIONAL
echo ====================================================
echo.
echo Verificando Node.js...
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] No se encontro Node.js instalado.
    echo Por favor descargue e instale Node.js desde https://nodejs.org/
    pause
    exit
)

echo [1/3] Instalando dependencias del Servidor (Backend)...
cd /d "%~dp0billing-api"
call npm install --omit=dev --no-audit
echo ✅ Servidor listo.
echo.

echo [2/3] Instalando dependencias de la Interfaz (Frontend/Electron)...
cd /d "%~dp0"
call npm install --no-audit
echo ✅ Interfaz lista.
echo.

echo [3/3] Configurando Base de Datos del Cliente...
cd /d "%~dp0billing-api"
node setup-cliente.js
echo.

echo ====================================================
echo   INSTALACION COMPLETADA
echo   Ya puede usar "iniciar_sistema.bat" para entrar.
echo ====================================================
pause