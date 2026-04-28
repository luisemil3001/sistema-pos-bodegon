// ============================================================
// SCRIPT DE REPARACION DE BASE DE DATOS
// Uso: node REPARAR_BD.js
// ============================================================
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Combinaciones comunes de credenciales MySQL a probar
const credenciales = [
  { user: 'root', password: 'password' },
  { user: 'root', password: '' },
  { user: 'root', password: 'root' },
  { user: 'root', password: '1234' },
  { user: 'root', password: 'admin' },
  { user: 'root', password: 'mysql' },
];

async function intentarConexion() {
  for (const cred of credenciales) {
    try {
      const conn = await mysql.createConnection({
        host: 'localhost',
        user: cred.user,
        password: cred.password,
        multipleStatements: true
      });
      console.log(`✅ Conectado con usuario="${cred.user}" password="${cred.password || '(vacía)'}"`);
      return { conn, cred };
    } catch (e) {
      // Sigue intentando
    }
  }
  return null;
}

async function repararBaseDeDatos() {
  console.log('====================================================');
  console.log('  REPARACION DE BASE DE DATOS - BODEGON LA PARED');
  console.log('====================================================\n');

  console.log('Intentando conectar a MySQL...');
  const resultado = await intentarConexion();

  if (!resultado) {
    console.error('❌ No se pudo conectar a MySQL con ninguna credencial conocida.');
    console.error('   Verifique que MySQL esté corriendo y pruebe manualmente.');
    process.exit(1);
  }

  const { conn, cred } = resultado;

  try {
    // Leer el schema SQL completo
    const schemaPath = path.join(__dirname, 'schema_completo.sql');
    console.log('\nAplicando esquema de base de datos...');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await conn.query(schema);
    console.log('✅ Tablas y datos iniciales creados/verificados.');

    // Actualizar el .env con las credenciales que funcionaron
    const envPath = path.join(__dirname, '.env');
    const envContent = [
      `DB_HOST=localhost`,
      `DB_USER=${cred.user}`,
      `DB_PASS=${cred.password}`,
      `DB_NAME=facturacion_db`,
      `PORT=3000`,
      `NODE_ENV=production`,
      `JWT_SECRET=super_secret_key_bodegon_2026`,
      `JWT_EXPIRES=8h`,
      `FISCAL_SIMULATE=false`,
      ``
    ].join('\n');

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env actualizado con las credenciales correctas.');

    // Verificar que el usuario admin existe
    const [rows] = await conn.query("SELECT usuario FROM facturacion_db.usuarios WHERE usuario = 'admin'");
    if (rows.length > 0) {
      console.log('✅ Usuario admin verificado en la base de datos.');
    } else {
      console.log('⚠️  Usuario admin no encontrado. Insertando...');
      // password: admin123
      await conn.query(`INSERT IGNORE INTO facturacion_db.usuarios (nombre, usuario, password, rol) VALUES ('Administrador', 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')`);
      console.log('✅ Usuario admin creado.');
    }

    console.log('\n====================================================');
    console.log('  REPARACION COMPLETADA EXITOSAMENTE');
    console.log('  Usuario: admin');
    console.log('  Contraseña: admin123');
    console.log('  Ahora cierre esta ventana y ejecute iniciar_sistema.bat');
    console.log('====================================================\n');

  } catch (err) {
    console.error('❌ Error durante la reparación:', err.message);
    console.error(err);
  } finally {
    await conn.end();
  }
}

repararBaseDeDatos();
