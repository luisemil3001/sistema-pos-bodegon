const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupTerminal() {
  console.log('====================================================');
  console.log('  CONFIGURADOR DE PUNTO DE VENTA (CAJA ADICIONAL)   ');
  console.log('           SISTEMA BODEGON LA PARED                 ');
  console.log('====================================================\n');

  console.log('Este asistente conectara esta caja con el Servidor Central.\n');

  const serverIp = await question('1. Ingrese la IP del SERVIDOR (ej: 192.168.1.50): ');
  if (!serverIp) {
    console.log('❌ Error: La IP del servidor es obligatoria.');
    process.exit(1);
  }

  const dbUser = await question('2. Usuario de MySQL del Servidor (default: root): ') || 'root';
  const dbPass = await question('3. Password de MySQL del Servidor (default: ninguno): ') || '';
  const printerPort = await question('4. Puerto COM de la Impresora en ESTA CAJA (ej: COM1): ') || 'COM1';

  console.log('\nValidando conexion con el servidor...');

  try {
    const connection = await mysql.createConnection({
      host: serverIp,
      user: dbUser,
      password: dbPass,
      database: 'facturacion_db',
      connectTimeout: 5000
    });
    
    console.log('✅ Conexion con el Servidor Central EXITOSA.');
    await connection.end();
  } catch (err) {
    console.log('\n⚠️ ADVERTENCIA: No se pudo conectar a la base de datos del servidor.');
    console.log(`Motivo: ${err.message}`);
    const seguir = await question('\n¿Desea continuar con la configuracion de todos modos? (s/n): ');
    if (seguir.toLowerCase() !== 's') process.exit(1);
  }

  // Crear archivo .env local para esta caja (Backend)
  const envContent = `DB_HOST=${serverIp}\nDB_USER=${dbUser}\nDB_PASS=${dbPass}\nDB_NAME=facturacion_db\nPORT=3000\nNODE_ENV=production\nJWT_SECRET=super_secret_key_bodegon_2026\nJWT_EXPIRES=8h\nPRINTER_COM_PORT=${printerPort}\nFISCAL_SIMULATE=false\n`;
  fs.writeFileSync(path.join(__dirname, '.env'), envContent);

  // Crear archivo .env para la Interfaz (Frontend - Vite) en la raíz
  const feEnvContent = `VITE_API_URL=http://${serverIp}:3000/api\n`;
  fs.writeFileSync(path.join(__dirname, '..', '.env'), feEnvContent);

  console.log('\n✅ Archivos de configuracion (.env) generados correctamente.');
  console.log('✅ Interfaz vinculada a: http://' + serverIp + ':3000');

  console.log('\n====================================================');
  console.log('  ¡TERMINAL CONFIGURADA CORRECTAMENTE!');
  console.log('  IP Servidor: ' + serverIp);
  console.log('  Impresora: ' + printerPort);
  console.log('====================================================\n');
  
  rl.close();
}

setupTerminal();
