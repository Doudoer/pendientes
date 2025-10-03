# G-Partes - Sistema de Gestión de Ventas

Sistema web para la gestión de ventas de partes automotrices con control de estatus, roles de usuario y módulo de reclamos.

## Características

### Roles de Usuario
- **Vendedor**: Puede crear nuevas ventas
- **Dueño**: Puede actualizar el estatus de las ventas y reclamos
- **Admin**: Acceso completo - CRUD de ventas, gestión de usuarios

### Gestión de Ventas
- Registro de ventas con información del cliente (Nombre, Teléfono)
- Validación de partes mediante API (Marca, Modelo, Año)
- Campos: Parte, Precio, Fecha
- Sistema de estatus:
  - **Buscando** / **Listo**: Pendientes (visibles en Dashboard)
  - **Entregado** / **Reembolsado**: Archivados (ocultos por defecto)

### Módulo de Reclamos
- Gestión de post-venta
- Tipos: Cambio, Reembolso
- Estados: Abierto, Procesando, Resuelto, Rechazado

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/Doudoer/pendientes.git
cd pendientes
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno (opcional):
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. Iniciar el servidor:
```bash
npm start
```

5. Acceder a la aplicación:
```
http://localhost:3000
```

## Credenciales por Defecto

Al iniciar la aplicación por primera vez, se crea un usuario administrador:
- **Usuario**: `admin`
- **Contraseña**: `admin123`

⚠️ **Importante**: Cambiar estas credenciales inmediatamente en producción.

## Uso

### Login
1. Acceder a `http://localhost:3000`
2. Ingresar credenciales
3. Se redirige al Dashboard según rol

### Crear Venta (Vendedor/Admin)
1. Click en "Nueva Venta"
2. Completar formulario:
   - Datos del cliente
   - Marca, Modelo, Año (se valida automáticamente)
   - Parte y Precio
   - Fecha de venta
3. Guardar

### Actualizar Estatus (Dueño/Admin)
1. En la tabla de ventas, seleccionar nuevo estatus del dropdown
2. El cambio se aplica automáticamente

### Crear Reclamo
1. Ir a la pestaña "Reclamos"
2. Click en "Nuevo Reclamo"
3. Ingresar ID de venta, tipo y descripción
4. Guardar

### Gestión de Usuarios (Admin)
1. Ir a la pestaña "Usuarios"
2. Crear, editar o eliminar usuarios
3. Asignar roles apropiados

## Estructura del Proyecto

```
pendientes/
├── src/
│   ├── models/
│   │   └── database.js          # Configuración SQLite y esquema
│   ├── routes/
│   │   ├── auth.js              # Rutas de autenticación
│   │   ├── sales.js             # Rutas de ventas
│   │   ├── claims.js            # Rutas de reclamos
│   │   └── users.js             # Rutas de usuarios
│   ├── middleware/
│   │   └── auth.js              # Middleware de autenticación
│   └── server.js                # Servidor Express
├── public/
│   ├── css/
│   │   └── styles.css           # Estilos de la aplicación
│   ├── js/
│   │   └── app.js               # Lógica frontend
│   └── index.html               # Interfaz principal
├── package.json
└── README.md
```

## Tecnologías

- **Backend**: Node.js, Express
- **Base de Datos**: SQLite3
- **Autenticación**: JWT, bcryptjs
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Ventas
- `GET /api/sales` - Listar ventas
- `POST /api/sales` - Crear venta (Vendedor/Admin)
- `GET /api/sales/:id` - Obtener venta
- `PUT /api/sales/:id` - Actualizar venta (Admin)
- `PATCH /api/sales/:id/status` - Actualizar estatus (Dueño/Admin)
- `DELETE /api/sales/:id` - Eliminar venta (Admin)

### Reclamos
- `GET /api/claims` - Listar reclamos
- `POST /api/claims` - Crear reclamo
- `GET /api/claims/:id` - Obtener reclamo
- `PATCH /api/claims/:id/status` - Actualizar estatus (Dueño/Admin)
- `DELETE /api/claims/:id` - Eliminar reclamo (Admin)

### Usuarios
- `GET /api/users` - Listar usuarios (Admin)
- `POST /api/users` - Crear usuario (Admin)
- `PUT /api/users/:id` - Actualizar usuario (Admin)
- `DELETE /api/users/:id` - Eliminar usuario (Admin)

## Licencia

ISC
