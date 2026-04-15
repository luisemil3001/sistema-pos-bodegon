-- =============================================================
-- SCHEMA COMPLETO - SISTEMA POS BODEGON LA PARED
-- VERSION: 1.0 - PRODUCCION
-- Este archivo reemplaza database.sql + todos los db_patch_*.js
-- Ejecutar UNA SOLA VEZ en una base de datos nueva
-- =============================================================

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS facturacion_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE facturacion_db;

-- =============================================================
-- TABLA: empresas
-- Contiene la configuración principal del negocio
-- =============================================================
CREATE TABLE IF NOT EXISTS empresas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    rnc VARCHAR(20),
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    itbis_tasa DECIMAL(5,2) DEFAULT 16.00,
    igtf_tasa DECIMAL(5,2) DEFAULT 3.00,
    moneda VARCHAR(5) DEFAULT 'VES',
    logo_url TEXT,
    tipo_impresora ENUM('pos', 'fiscal') DEFAULT 'pos',
    marca_fiscal ENUM('tfhka', 'epson', 'bematech', 'generica') DEFAULT 'generica',
    puerto_impresora VARCHAR(20) DEFAULT 'COM1',
    margen_vencimiento INT DEFAULT 30
);

-- =============================================================
-- TABLA: usuarios
-- Administradores y cajeros del sistema
-- =============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'cajero') DEFAULT 'cajero',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- TABLA: categorias
-- Categorías de productos
-- =============================================================
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- =============================================================
-- TABLA: proveedores
-- Proveedores / Distribuidores
-- =============================================================
CREATE TABLE IF NOT EXISTS proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    rnc_cedula VARCHAR(20) UNIQUE,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- TABLA: productos
-- Catálogo de productos del negocio
-- Incluye: proveedor, vencimiento, stock mínimo
-- =============================================================
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_barras VARCHAR(50) UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria_id INT,
    proveedor_id INT NULL,
    precio_costo DECIMAL(10,2) DEFAULT 0,
    precio_venta DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    fecha_vencimiento DATE DEFAULT NULL,
    min_stock INT DEFAULT 5,
    unidad VARCHAR(20) DEFAULT 'unid',
    FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL
);

-- =============================================================
-- TABLA: clientes
-- Clientes registrados
-- =============================================================
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    rnc_cedula VARCHAR(20) UNIQUE,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- TABLA: cajas
-- Turnos / Sesiones de caja
-- =============================================================
CREATE TABLE IF NOT EXISTS cajas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    monto_apertura DECIMAL(10,2) NOT NULL,
    fecha_cierre TIMESTAMP NULL,
    monto_cierre DECIMAL(10,2) NULL,
    total_ventas_efectivo DECIMAL(10,2) DEFAULT 0,
    total_ventas_tarjeta DECIMAL(10,2) DEFAULT 0,
    diferencia DECIMAL(10,2) DEFAULT 0,
    observaciones TEXT,
    estado ENUM('abierta', 'cerrada') DEFAULT 'abierta',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- =============================================================
-- TABLA: facturas
-- Ventas / Facturas emitidas
-- Incluye: caja, IGTF, nota de crédito
-- =============================================================
CREATE TABLE IF NOT EXISTS facturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_factura VARCHAR(20) UNIQUE NOT NULL,
    cliente_id INT,
    usuario_id INT,
    caja_id INT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL,
    itbis DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    igtf_monto DECIMAL(15,2) DEFAULT 0.00,
    metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia', 'credito', 'divisas', 'dolares', 'mixto') DEFAULT 'efectivo',
    estado ENUM('pagada', 'anulada') DEFAULT 'pagada',
    tiene_nota_credito BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (caja_id) REFERENCES cajas(id)
);

-- =============================================================
-- TABLA: factura_items
-- Líneas de detalle de cada factura
-- =============================================================
CREATE TABLE IF NOT EXISTS factura_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    factura_id INT,
    producto_id INT,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (factura_id) REFERENCES facturas(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- =============================================================
-- TABLA: compras
-- Entradas de mercancía / Compras a proveedores
-- =============================================================
CREATE TABLE IF NOT EXISTS compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_factura_proveedor VARCHAR(50) NOT NULL,
    proveedor_id INT,
    usuario_id INT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL,
    itbis DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia', 'credito') DEFAULT 'efectivo',
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- =============================================================
-- TABLA: compra_items
-- Líneas de detalle de cada compra
-- =============================================================
CREATE TABLE IF NOT EXISTS compra_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT,
    producto_id INT,
    cantidad INT NOT NULL,
    costo_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (compra_id) REFERENCES compras(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- =============================================================
-- TABLA: ajustes_stock
-- Historial de ajustes manuales de inventario (mermas, entradas)
-- =============================================================
CREATE TABLE IF NOT EXISTS ajustes_stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    usuario_id INT DEFAULT NULL,
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    cantidad_ajuste INT NOT NULL,
    tipo ENUM('ENTRADA', 'SALIDA', 'MERMA', 'AJUSTE_FISICO') NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- =============================================================
-- TABLA: notas_credito
-- Notas de crédito (devoluciones parciales o totales)
-- =============================================================
CREATE TABLE IF NOT EXISTS notas_credito (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_nota VARCHAR(25) UNIQUE NOT NULL,
    factura_id INT NOT NULL,
    usuario_id INT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motivo TEXT,
    tipo ENUM('total', 'parcial') DEFAULT 'total',
    subtotal DECIMAL(15,2) DEFAULT 0,
    iva DECIMAL(15,2) DEFAULT 0,
    igtf_monto DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL,
    metodo_devolucion ENUM('efectivo', 'transferencia', 'tarjeta') DEFAULT 'efectivo',
    estado ENUM('activa', 'anulada') DEFAULT 'activa',
    FOREIGN KEY (factura_id) REFERENCES facturas(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- =============================================================
-- TABLA: notas_credito_items
-- Productos incluidos en la nota de crédito
-- =============================================================
CREATE TABLE IF NOT EXISTS notas_credito_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nota_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(15,2) NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (nota_id) REFERENCES notas_credito(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- =============================================================
-- TABLA: cotizaciones
-- Presupuestos / Cotizaciones antes de facturar
-- =============================================================
CREATE TABLE IF NOT EXISTS cotizaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_cotizacion VARCHAR(20) UNIQUE NOT NULL,
    cliente_id INT NULL,
    usuario_id INT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validez_dias INT DEFAULT 7,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    itbis DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    igtf_monto DECIMAL(15,2) DEFAULT 0.00,
    descuento DECIMAL(15,2) DEFAULT 0.00,
    total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    estado ENUM('pendiente', 'facturada', 'vencida', 'anulada') DEFAULT 'pendiente',
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- =============================================================
-- TABLA: cotizacion_items
-- Productos de cada cotización
-- =============================================================
CREATE TABLE IF NOT EXISTS cotizacion_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cotizacion_id INT,
    producto_id INT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(15,2) NOT NULL,
    aplica_iva BOOLEAN DEFAULT TRUE,
    subtotal DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
);

-- =============================================================
-- DATOS INICIALES
-- =============================================================

-- Configuración de la empresa (EDITAR después de instalar desde el sistema)
INSERT INTO empresas (nombre, rnc, direccion, telefono, itbis_tasa, igtf_tasa, moneda, tipo_impresora, marca_fiscal, puerto_impresora, margen_vencimiento)
VALUES ('Bodegon La Pared', 'J-XXXXXXXX-X', 'Dirección del Negocio', '0414-000-0000', 16.00, 3.00, 'VES', 'pos', 'generica', 'COM1', 30);

-- Usuario administrador inicial
-- Contraseña: admin123
-- IMPORTANTE: Cambiar la contraseña desde el sistema después de la primera instalación
INSERT INTO usuarios (nombre, usuario, password, rol)
VALUES ('Administrador', 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Categorías base
INSERT INTO categorias (nombre) VALUES
    ('General'),
    ('Alimentos'),
    ('Bebidas'),
    ('Licores'),
    ('Limpieza'),
    ('Higiene Personal'),
    ('Lacteos'),
    ('Embutidos'),
    ('Granos y Cereales'),
    ('Snacks');
