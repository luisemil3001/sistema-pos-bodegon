@echo off
title INSTALADOR AUTOMATICO - SISTEMA DE FACTURACION
cls
echo ====================================================
echo   SISTEMA DE FACTURACION - INSTALADOR AUTOMATICO
echo ====================================================
echo.
echo [1/3] Limpiando instalaciones previas...
docker-compose down
echo.
echo [2/3] Construyendo contenedores profesionales...
docker-compose up -d --build
echo.
echo [3/3] Configurando base de datos...
node update_db_cajas.cjs
echo.
echo ====================================================
echo   ¡SISTEMA INSTALADO Y CORRIENDO!
echo ====================================================
echo   Acceso Local: http://localhost
echo   Acceso Red: http://DIRGENERAL-01
echo ====================================================
pause