# Guía Rápida - G-Partes

## Inicio Rápido

```bash
npm install
npm start
```

Acceder: http://localhost:3000  
Login: `admin` / `admin123`

## Flujo de Trabajo

### 1. Vendedor crea una venta
- Login con rol "vendedor"
- Click en "Nueva Venta"
- Completar formulario con datos del cliente y parte
- El sistema valida automáticamente Marca/Modelo/Año
- La venta se crea con estatus "Buscando"

### 2. Dueño actualiza el estatus
- Login con rol "dueno"
- Ir a Dashboard > Ventas
- Seleccionar nuevo estatus en el dropdown
- Estados disponibles:
  - **Buscando**: La parte está siendo buscada
  - **Listo**: La parte está lista para entrega
  - **Entregado**: Venta completada (se archiva)
  - **Reembolsado**: Venta reembolsada (se archiva)

### 3. Dashboard muestra solo pendientes
- Por defecto, se muestran solo ventas con estatus "Buscando" y "Listo"
- Las ventas "Entregado" y "Reembolsado" están archivadas
- Marcar "Mostrar Archivados" para ver todas las ventas

### 4. Módulo de Reclamos
- Cualquier usuario puede crear un reclamo
- Click en "Nuevo Reclamo"
- Ingresar ID de venta, tipo (Cambio/Reembolso) y descripción
- Dueño/Admin pueden actualizar el estatus del reclamo:
  - Abierto → Procesando → Resuelto/Rechazado

### 5. Admin gestiona usuarios
- Solo Admin puede acceder a "Usuarios"
- Crear nuevos usuarios con roles específicos
- Editar usuarios existentes
- Eliminar usuarios (excepto el propio)

## Permisos

| Acción | Vendedor | Dueño | Admin |
|--------|----------|-------|-------|
| Crear ventas | ✓ | ✓ | ✓ |
| Ver ventas | ✓ | ✓ | ✓ |
| Actualizar estatus ventas | ✗ | ✓ | ✓ |
| Editar/Eliminar ventas | ✗ | ✗ | ✓ |
| Crear reclamos | ✓ | ✓ | ✓ |
| Actualizar estatus reclamos | ✗ | ✓ | ✓ |
| Gestionar usuarios | ✗ | ✗ | ✓ |

## Variables de Entorno

Editar `.env` para personalizar:
```
PORT=3000
JWT_SECRET=tu-secreto-aqui
NODE_ENV=production
```

## Base de Datos

SQLite se inicializa automáticamente en `database.db`

Tablas:
- `users`: Usuarios del sistema
- `sales`: Ventas registradas
- `claims`: Reclamos de post-venta

## API Externa

La validación de partes está preparada para integrarse con una API externa.
Editar `src/routes/sales.js` función `validateCarPart()` para conectar con el servicio real.

## Seguridad

- Contraseñas encriptadas con bcryptjs
- Autenticación JWT con cookies httpOnly
- Validación de roles en cada endpoint
- Protección CSRF mediante cookies seguras

## Personalización

### Agregar nuevos estatus
1. Actualizar schema en `src/models/database.js`
2. Modificar validación en `src/routes/sales.js`
3. Actualizar opciones en `public/index.html`
4. Agregar estilos en `public/css/styles.css`

### Cambiar tema de colores
Editar variables en `public/css/styles.css`:
- Primario: `#667eea`
- Secundario: `#764ba2`
