-- =============================================================
-- SCHEMA COMPLETO - SISTEMA POS BODEGON LA PARED
-- VERSION: 1.1 - PRODUCCION FINAL
-- =============================================================

CREATE DATABASE IF NOT EXISTS facturacion_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE facturacion_db;

-- TABLA: empresas
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
    tasa_dolar DECIMAL(10,4) DEFAULT 36.50,
    auto_sync_bcv BOOLEAN DEFAULT TRUE,
    tipo_impresora ENUM('pos', 'fiscal') DEFAULT 'pos',
    marca_fiscal ENUM('tfhka', 'epson', 'bematech', 'generica') DEFAULT 'generica',
    puerto_impresora VARCHAR(20) DEFAULT 'COM1',
    margen_vencimiento INT DEFAULT 30
);

-- TABLA: usuarios (admin / cajero)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'cajero') DEFAULT 'cajero',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: categorias
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- TABLA: proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    rnc_cedula VARCHAR(20) UNIQUE,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: productos (soporta decimales para pesables)
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_barras VARCHAR(50) UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria_id INT,
    proveedor_id INT NULL,
    precio_costo DECIMAL(15,2) DEFAULT 0,
    precio_venta DECIMAL(15,2) NOT NULL,
    stock DECIMAL(15,3) DEFAULT 0.000,
    min_stock DECIMAL(15,3) DEFAULT 5.000,
    fecha_vencimiento DATE DEFAULT NULL,
    unidad VARCHAR(20) DEFAULT 'unid',
    aplica_iva BOOLEAN DEFAULT TRUE,
    es_pesable BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL
);

-- TABLA: clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    rnc_cedula VARCHAR(20) UNIQUE,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: estaciones_trabajo
CREATE TABLE IF NOT EXISTS estaciones_trabajo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: cajas (turnos)
CREATE TABLE IF NOT EXISTS cajas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    estacion_id INT,
    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    monto_apertura DECIMAL(15,2) NOT NULL,
    fecha_cierre TIMESTAMP NULL,
    monto_cierre DECIMAL(15,2) NULL,
    total_ventas_efectivo DECIMAL(15,2) DEFAULT 0,
    total_ventas_tarjeta DECIMAL(15,2) DEFAULT 0,
    diferencia DECIMAL(15,2) DEFAULT 0,
    observaciones TEXT,
    estado ENUM('abierta', 'cerrada') DEFAULT 'abierta',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (estacion_id) REFERENCES estaciones_trabajo(id)
);

-- TABLA: facturas
CREATE TABLE IF NOT EXISTS facturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_factura VARCHAR(25) UNIQUE NOT NULL,
    cliente_id INT,
    usuario_id INT,
    caja_id INT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(15,2) NOT NULL,
    itbis DECIMAL(15,2) NOT NULL,
    igtf_monto DECIMAL(15,2) DEFAULT 0.00,
    descuento DECIMAL(15,2) DEFAULT 0.00,
    total DECIMAL(15,2) NOT NULL,
    tasa_cambio_usada DECIMAL(10,4) DEFAULT 1.0000,
    metodo_pago VARCHAR(50) DEFAULT 'efectivo',
    estado ENUM('pagada', 'anulada') DEFAULT 'pagada',
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (caja_id) REFERENCES cajas(id)
);

-- TABLA: factura_items (soporta decimales en cantidad)
CREATE TABLE IF NOT EXISTS factura_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    factura_id INT,
    producto_id INT,
    cantidad DECIMAL(15,3) NOT NULL,
    precio_unitario DECIMAL(15,2) NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (factura_id) REFERENCES facturas(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- TABLA: cotizaciones
CREATE TABLE IF NOT EXISTS cotizaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_cotizacion VARCHAR(25) UNIQUE NOT NULL,
    cliente_id INT,
    usuario_id INT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validez_dias INT DEFAULT 7,
    subtotal DECIMAL(15,2) DEFAULT 0,
    itbis DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) DEFAULT 0,
    tasa_cambio_usada DECIMAL(10,4),
    estado ENUM('pendiente', 'facturada', 'anulada') DEFAULT 'pendiente',
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- TABLA: cotizacion_items
CREATE TABLE IF NOT EXISTS cotizacion_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cotizacion_id INT,
    producto_id INT,
    cantidad DECIMAL(15,3),
    precio_unitario DECIMAL(15,2),
    subtotal DECIMAL(15,2),
    FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE
);

-- TABLA: compras
CREATE TABLE IF NOT EXISTS compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proveedor_id INT,
    usuario_id INT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(15,2),
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- DATOS INICIALES

-- Empresa por defecto
INSERT IGNORE INTO empresas (id, nombre, rnc, direccion, telefono, email, itbis_tasa, igtf_tasa, moneda, tasa_dolar, auto_sync_bcv) 
VALUES (1, 'BODEGON LA PARED', 'J-00000000', 'DIRECCION GENERAL', '0000-0000000', 'admin@example.com', 16.00, 3.00, 'VES', 36.50, 1);

-- Usuario: admin / Clave: admin123
INSERT IGNORE INTO usuarios (nombre, usuario, password, rol)
VALUES ('Administrador', 'admin', '$2b$10$.338tuKsIGRgfrlmpSGuMupplPvUMr4V78FQ020z1o78.5qgcjMvS', 'admin');

-- Estaciones iniciales
INSERT IGNORE INTO estaciones_trabajo (id, nombre, descripcion) VALUES (1, 'CAJA PRINCIPAL', 'Servidor Central');
INSERT IGNORE INTO estaciones_trabajo (id, nombre, descripcion) VALUES (2, 'CAJA 2', 'Terminal Adicional');

-- Categorías por defecto
INSERT IGNORE INTO categorias (nombre) VALUES ('General'), ('Alimentos'), ('Bebidas'), ('Licores'), ('Limpieza');
