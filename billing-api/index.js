const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
// En Docker usaremos el 3000 para ser consistentes con el docker-compose
const PORT = process.env.PORT || 3000; 

// --- CONFIGURACIÓN DE MIDDLEWARES ---
// Permitimos que el frontend (puerto 80) se comunique con la API
app.use(cors({
  origin: '*', // En producción profesional puedes poner la IP específica del cliente
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// --- RUTA DE SALUD (Health Check) ---
app.get('/', (req, res) => {
  res.json({ 
    status: 'Sistema Operativo',
    message: 'Bienvenido a la API de Facturación - Ribero',
    timestamp: new Date().toISOString()
  });
});

// --- CARGA DE RUTAS ---
// Nota: Asegúrate de que estos archivos existan en la carpeta /src/routes/
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/settings', require('./src/routes/settingRoutes'));
app.use('/api/invoices', require('./src/routes/invoiceRoutes'));
app.use('/api/customers', require('./src/routes/customerRoutes'));
app.use('/api/reports', require('./src/routes/reportRoutes'));
app.use('/api/proveedores', require('./src/routes/proveedorRoutes'));
app.use('/api/compras', require('./src/routes/compraRoutes'));
app.use('/api/contabilidad', require('./src/routes/contabilidadRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/caja', require('./src/routes/cajaRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));

// --- MANEJO DE RUTAS NO ENCONTRADAS (404) ---
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// --- INICIO DEL SERVIDOR ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`===========================================`);
  console.log(`  SERVIDOR PROFESIONAL DE FACTURACION  `);
  console.log(`  Puerto: ${PORT} | Modo: ${process.env.NODE_ENV} `);
  console.log(`===========================================`);
});
