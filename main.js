const { app, BrowserWindow, dialog } = require('electron');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs'); // Añadido para verificar archivos

let backendProcess;

function checkMySQLAndStart() {
  // Verificamos si el servicio MySQL está corriendo
  exec('sc query MySql', (error, stdout) => {
    if (error || !stdout.includes('RUNNING')) {
      dialog.showErrorBox(
        'Atención: Base de Datos',
        'El servicio de MySQL no parece estar corriendo. Si el sistema no inicia, por favor verifique que MySQL esté activo.'
      );
    }
    startBackend();
  });
}

function startBackend() {
  // 1. Definimos las rutas posibles según si es desarrollo o producción
  const baseDir = app.isPackaged 
    ? path.join(process.resourcesPath, 'billing-api') 
    : path.join(__dirname, 'billing-api');
  
  const backendPath = path.join(baseDir, 'index.js');

  // 2. Verificación de seguridad: ¿Existe el archivo antes de lanzarlo?
  if (!fs.existsSync(backendPath)) {
    console.error("No se encontró el backend en:", backendPath);
    return;
  }

  // 3. Lanzamos el proceso con 'cwd' para que Node sepa dónde está parado
  backendProcess = spawn('node', [backendPath], {
    shell: true,
    cwd: baseDir, // <-- ESTO ES LO QUE LE FALTABA: El directorio de trabajo
    env: { 
      ...process.env, 
      PORT: 3000, 
      NODE_ENV: 'production' 
    }
  });

  // Capturamos logs por si necesitas ver qué pasa con Ctrl+Shift+I
  backendProcess.stdout.on('data', (data) => console.log(`Backend Log: ${data}`));
  backendProcess.stderr.on('data', (data) => console.error(`Backend Error: ${data}`));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "SISTEMA POS - BODEGON LA PARED",
    webPreferences: { 
      nodeIntegration: true,
      contextIsolation: false 
    }
  });

  if (app.isPackaged) {
    checkMySQLAndStart(); 
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    win.loadURL('http://localhost:5773');
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (backendProcess) {
    if (process.platform === 'win32') {
      // Forzamos el cierre de cualquier proceso de node hijo
      exec('taskkill /f /t /im node.exe');
    } else {
      backendProcess.kill();
    }
  }
  app.quit();
});