-- Crear base de datos
CREATE DATABASE IF NOT EXISTS facturacion_db;
USE facturacion_db;

-- Tabla de Empresas
CREATE TABLE IF NOT EXISTS empresas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    rnc VARCHAR(20),
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    itbis_tasa DECIMAL(5,2) DEFAULT 18.00,
    moneda VARCHAR(5) DEFAULT 'DOP',
    logo_url TEXT
);

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'cajero') DEFAULT 'cajero',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Categorías
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Tabla de Productos
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_barras VARCHAR(50) UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria_id INT,
    precio_costo DECIMAL(10,2) DEFAULT 0,
    precio_venta DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    min_stock INT DEFAULT 5,
    unidad VARCHAR(20) DEFAULT 'unid',
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    rnc_cedula VARCHAR(20) UNIQUE,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Facturas
CREATE TABLE IF NOT EXISTS facturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_factura VARCHAR(20) UNIQUE NOT NULL,
    cliente_id INT,
    usuario_id INT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL,
    itbis DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia') DEFAULT 'efectivo',
    estado ENUM('pagada', 'anulada') DEFAULT 'pagada',
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Detalle de Facturas
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

-- Insertar datos iniciales
INSERT INTO empresas (nombre, rnc, direccion, telefono) 
VALUES ('Mi Supermercado/Farmacia', '123-45678-9', 'Calle Principal #1', '809-000-0000');

-- La contraseña es 'admin123' (podrás cambiarla luego)
-- Hash generado para bcrypt
INSERT INTO usuarios (nombre, usuario, password, rol) 
VALUES ('Administrador', 'admin', '$2b$10$vI8qS/S2BfI/t/H.k5vVp.oNfE8/j6v6vO6S6vO6S6vO6S6vO6S6', 'admin');

INSERT INTO categorias (nombre) VALUES ('General'), ('Medicamentos'), ('Alimentos'), ('Bebidas');
