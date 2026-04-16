# Sistema POS - Bodegón La Pared

Un sistema completo de punto de venta desarrollado con React 19, TypeScript, Node.js y MySQL, diseñado para pequeñas y medianas empresas del sector retail.

## 🚀 Características Principales

### Gestión Completa
- **Productos**: Catálogo con códigos de barras, categorías y proveedores
- **Clientes**: Base de datos de clientes con RNC/Cédula
- **Proveedores**: Gestión de distribuidores y proveedores
- **Facturación**: Sistema completo de facturación con impresión fiscal
- **Inventario**: Control de stock con alertas de stock mínimo
- **Usuarios**: Sistema de roles (Admin/Cajero) con permisos
- **Reportes**: Dashboard con estadísticas y reportes detallados

### Tecnologías Modernas
- **Frontend**: React 19 con TypeScript, Vite, React Router
- **Backend**: Node.js con Express, MySQL con autenticación JWT
- **UI/UX**: Componentes modernos con temas personalizables
- **Despliegue**: Electron para aplicaciones de escritorio

## 🛠️ Mejoras Implementadas

### 1. **Manejo Global de Errores**
- ErrorBoundary para capturar errores no manejados
- Sistema centralizado de manejo de errores con mensajes consistentes
- Componentes de notificación elegantes (AlertMessage)
- Indicadores de carga mejorados (LoadingSpinner)

### 2. **Rendimiento Optimizado**
- Code-splitting con React.lazy y Suspense
- Bundle más pequeño y carga incremental
- Paginación inteligente en todas las tablas
- Optimización automática de assets

### 3. **Sistema de Temas**
- 3 temas disponibles: Claro, Oscuro y Azul
- Cambio dinámico sin recargar la página
- Persistencia automática en localStorage
- Variables CSS personalizables

### 4. **TypeScript Integration**
- Configuración completa de TypeScript
- Tipos definidos para todas las entidades
- Mejor autocompletado y detección de errores
- Migración gradual de archivos JavaScript

### 5. **Validación Robusta**
- Hook useFormValidation para validaciones en tiempo real
- Mensajes de error específicos y útiles
- Validación automática en blur y submit

### 6. **Experiencia de Usuario Mejorada**
- Navegación fluida con paginación
- Mensajes de feedback consistentes
- Indicadores de carga en todas las operaciones
- Interfaz responsive y moderna

## 📦 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- MySQL 8+
- Git

### Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd mi-primer-react
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar la base de datos**
```bash
# En el directorio billing-api/
cd billing-api
npm install
# Configurar las variables de entorno en .env
# Ejecutar las migraciones de base de datos
```

4. **Desarrollo**
```bash
# Iniciar el backend
cd billing-api
npm start

# En otra terminal, iniciar el frontend
npm run dev
```

5. **Construir para producción**
```bash
npm run build
npm run make  # Para crear instalador de Electron
```

## 🏗️ Arquitectura del Proyecto

```
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── AlertMessage.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── Pagination.tsx
│   │   └── ThemeSelector.tsx
│   ├── hooks/              # Hooks personalizados
│   │   ├── useErrorHandler.ts
│   │   ├── usePagination.ts
│   │   └── useFormValidation.js
│   ├── pages/              # Páginas principales
│   │   ├── Products/
│   │   ├── Customers/
│   │   ├── Invoices/
│   │   └── Users/
│   ├── types/              # Definiciones TypeScript
│   │   └── index.ts
│   └── utils/              # Utilidades
├── billing-api/            # Backend API
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── services/
│   └── package.json
└── package.json
```

## 🎨 Temas Disponibles

### Tema Claro (Default)
- Fondo blanco con acentos azules
- Ideal para entornos de oficina

### Tema Oscuro
- Fondo oscuro para reducir fatiga visual
- Perfecto para uso nocturno

### Tema Azul
- Tema moderno con tonos azules
- Diseño elegante y profesional

## 🔧 Scripts Disponibles

```bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Construir para producción
npm run type-check   # Verificar tipos TypeScript
npm run lint         # Ejecutar ESLint
npm run preview      # Vista previa de producción
npm run start        # Iniciar aplicación Electron
npm run package      # Crear paquete Electron
npm run make         # Crear instalador
```

## 📊 Características Técnicas

### Frontend
- **React 19** con hooks modernos
- **TypeScript** para type safety
- **Vite** para desarrollo rápido
- **React Router** para navegación
- **Axios** para llamadas API
- **Lucide React** para iconos

### Backend
- **Node.js + Express** para API REST
- **MySQL** con pool de conexiones
- **JWT** para autenticación
- **bcryptjs** para hash de contraseñas
- **Serial port** para impresoras fiscales

### Base de Datos
- **MySQL 8+** con índices optimizados
- **Migraciones** automáticas
- **Triggers** para integridad de datos
- **Vistas** para reportes complejos

## 🚀 Despliegue

### Desarrollo Local
```bash
npm run dev
```

### Producción
```bash
npm run build
npm run make
```

### Docker (Opcional)
```bash
docker-compose up -d
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Soporte

Para soporte técnico o consultas:
- Email: soporte@bodegonlapared.com
- WhatsApp: +1 (829) 123-4567

## 🔄 Próximas Mejoras Planificadas

- [ ] Tests unitarios con Jest
- [ ] PWA features para uso offline
- [ ] Integración con servicios de delivery
- [ ] API de facturación electrónica
- [ ] Dashboard con gráficos avanzados
- [ ] Sistema de backups automáticos

---

**Desarrollado con ❤️ para Bodegón La Pared**
