@echo off
cd /d "%~dp0"
title INSTALADOR MAESTRO - SISTEMA POS BODEGON
cls
echo ====================================================
echo   ASISTENTE DE DESPLIEGUE CLOUD-TO-LOCAL
echo   SISTEMA POS BODEGON LA PARED
echo ====================================================
echo.

:: Verificación de Git
git --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [!] ERROR: Git no detectado en este sistema.
    echo Por favor, instale Git primero o use la opcion de descarga manual [ZIP].
    echo Descarga Git en: https://git-scm.com/
    pause
    exit
)

echo [+] Verificacion de Git: OK.
echo [+] Iniciando descarga del sistema desde GitHub...
echo.

:: Clonar repositorio
git clone https://github.com/luisemil3001/sistema-pos-bodegon.git

IF %ERRORLEVEL% NEQ 0 (
    echo [!] ERROR al descargar el código. Verifique su conexion a internet.
    pause
    exit
)

echo.
echo [+] Repositorio descargado con exito.
echo [+] Entrando a la carpeta y lanzando instalador de dependencias...
echo.

cd sistema-pos-bodegon
call INSTALAR_SISTEMA.bat

echo.
echo ====================================================
echo   DESPLIEGUE MAESTRO FINALIZADO
echo   Puede iniciar el sistema con: iniciar_sistema.bat
echo ====================================================
pause
