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

segundo opcion 

¡**Funciona exactamente igual**, pero con un pequeñísimo detalle adicional que debes tomar en cuenta! 

Si descargas el código desde GitHub (.zip o clonado), recuerda que **GitHub NO guarda las carpetas `node_modules`** (esto es por diseño, para que no pese gigabytes el repositorio).

Por lo tanto, el flujo perfecto si lo descargas desde GitHub en la PC del cliente es este (y es increíblemente limpio):

1. **Descargas el código** de GitHub y lo descomprimes.
2. Le das doble click al **`INSTALAR_SISTEMA.bat`**.
   * *Esto instalará los módulos del backend, creará la base de datos `facturacion_db` y generará el archivo `.env` con las contraseñas que pusiste.*
3. Abres una consola (Terminal/CMD) en esa carpeta y escribes **`npm install`**.
   * *Esto es obligatorio si usas GitHub, porque descargará Electron, React y Vite (herramientas necesarias para compilar el exe).*
4. Luego, en esa misma consola escribes **`npm run make`**.
   * *Aquí viene la magia: Electron agarrará el `.env` que acabas de crear en el paso 2 (con la contraseña correcta), empaquetará el backend y te creará tu `.exe` hecho a la medida.*
5. **Instalas el `.exe`** generado en la carpeta `out/make/...`. ¡Y listo!

### En resumen:
La única diferencia entre el Pendrive y GitHub es el **Paso 3 (`npm install` frontal)**. 
- En el Pendrive te saltas el paso 3 (porque ya lo traes instalado de tu casa).
- Desde GitHub, necesitas hacer el paso 3 porque los repositorios no guardan la carpeta `node_modules` principal.

Del resto, toda la lógica que automatizamos hoy de la base de datos y la configuración te va a funcionar de maravilla sea por pendrive o por GitHub. ¡El manual sirve perfecto!