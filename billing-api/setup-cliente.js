const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
  console.log('====================================================');
  console.log('  CONFIGURACION DE BASE DE DATOS - BODEGON LA PARED ');
  console.log('====================================================\n');

  console.log('Por favor, ingresa los datos de conexión a MySQL.');
  console.log('Si presionas ENTER, se usarán los valores por defecto.\n');

  const host = await question('Host de MySQL (default: localhost): ') || 'localhost';
  const user = await question('Usuario de MySQL (default: root): ') || 'root';
  const password = await question('Contraseña de MySQL (default: sin contraseña): ') || '';
  
  rl.close();

  console.log('\nConectando a MySQL...');
  
  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      user,
      password,
      multipleStatements: true
    });
    console.log('✅ Conectado a MySQL exitosamente.');
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    process.exit(1);
  }

  try {
    console.log('\nLeyendo e instalando esquema de la base de datos...');
    const schemaPath = path.join(__dirname, 'schema_completo.sql');
    
    if (!fs.existsSync(schemaPath)) {
        throw new Error(`No se encontró el archivo ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await connection.query(schema);
    
    console.log('✅ Base de datos "facturacion_db" creada e inicializada.');
    console.log('✅ Tablas y datos iniciales insertados.');
    
    // Crear/Actualizar archivo .env
    const envPath = path.join(__dirname, '.env');
    const envContent = `DB_HOST=${host}\nDB_USER=${user}\nDB_PASS=${password}\nDB_NAME=facturacion_db\nPORT=3000\nNODE_ENV=production\nJWT_SECRET=super_secret_key_bodegon_2026\nJWT_EXPIRES=8h\nFISCAL_SIMULATE=false\n`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo de configuración (.env) generado con éxito.');

    console.log('\n====================================================');
    console.log('  INSTALACION COMPLETADA EXITOSAMENTE');
    console.log('  El sistema ya puede ser iniciado.');
    console.log('====================================================\n');

  } catch (err) {
    console.error('❌ Error durante la instalación:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

setup();
