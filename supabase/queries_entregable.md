# Entregable Final: Gestión de Base de Datos y Seguridad (SQL)

Este documento contiene la secuencia completa de operaciones SQL para la gestión de usuarios y permisos en Supabase. **Las secciones con ⭐ son las recomendadas para mostrar en la presentación "en vivo".**

---

## 1. Estructura y Seguridad Automática ⭐
Estas queries definen la tabla de usuarios y la lógica de auto-sincronización.

### A. Definición de la Tabla `usuarios`
```sql
CREATE TABLE IF NOT EXISTS public.usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  nombre_completo text,
  permisos_globales uuid[] DEFAULT '{}'::uuid[],
  fecha_nacimiento date,
  estado boolean DEFAULT true,
  creado_en timestamptz DEFAULT now()
);
```k

### B. Lógica de Sincronización (Trigger)
Esto asegura que cualquier usuario creado en el sistema de autenticación se refleje en la tabla de perfiles.
```sql
-- Función de sincronización
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, username, nombre_completo)
  VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1), NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Activación del Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

---

## 2. Simulación de Flujo: Registro de Usuario ⭐
Query para registrar un usuario manualmente desde la consola sin usar ninguna interfaz.

```sql
-- 1. Insertar un nuevo usuario de prueba
INSERT INTO public.usuarios (id, email, username, nombre_completo, fecha_nacimiento, permisos_globales)
VALUES (
  gen_random_uuid(), 
  'alumno_seguridad@universidad.edu', 
  'alumno_test', 
  'Estudiante de Seguridad',
  '2000-01-01',
  '{}'::uuid[],
  true -- Estado: Activo
);
```

---

## 3. Simulación de Flujo: Autenticación (Login) ⭐
Query que simula el proceso de inicio de sesión recuperando el perfil completo y sus permisos.

```sql
-- Consultar datos por correo electrónico (Solo si está activo)
SELECT id, username, email, nombre_completo, permisos_globales 
FROM public.usuarios 
WHERE email = 'alumno_seguridad@universidad.edu'
  AND estado = true;
```

---

## 4. Gestión de Permisos y Roles ⭐
Demostración de cómo se asignan y modifican los privilegios de un usuario.

### A. Asignación Masiva de Permisos
```sql
UPDATE public.usuarios
SET permisos_globales = ARRAY[
  '8a1b2c3d-e4f5-4a6b-8c7d-e8f9a0b1c2d3', -- UUID Permiso: Ver Tickets
  'a1b2c3d4-e5f6-4a7b-8c9d-a0b1c2d3e4f5'  -- UUID Permiso: Editar Usuarios
]::uuid[]
WHERE email = 'alumno_seguridad@universidad.edu';
```

### B. Adición de un solo Permiso (Append)
```sql
UPDATE public.usuarios
SET permisos_globales = array_append(permisos_globales, 'da39a3ee-5e6b-4b0d-ad8e-d9ed30154234'::uuid)
WHERE username = 'alumno_test';
```

---

## 5. Mantenimiento de Usuarios (CRUD)
Otras operaciones administrativas solicitadas.

### Actualización de Datos Personales
```sql
UPDATE public.usuarios
SET nombre_completo = 'Nombre Actualizado v2'
WHERE email = 'alumno_seguridad@universidad.edu';
```

### Baja Lógica (Desactivar Usuario)
```sql
UPDATE public.usuarios
SET estado = false
WHERE email = 'alumno_seguridad@universidad.edu';
```

### Eliminación Física (Si es requerida)
```sql
DELETE FROM public.usuarios 
WHERE email = 'usuario_a_borrar@ejemplo.com';
```

---

## 6. Reporte de Auditoría
Consulta para listar todos los usuarios y el conteo de sus permisos actuales.
```sql
SELECT 
    username, 
    nombre_completo, 
    array_length(permisos_globales, 1) as total_permisos
FROM public.usuarios
---

## 7. Configuración de Catálogos (Estados y Prioridades) ⭐
Inserción de valores iniciales para la lógica de negocio.

```sql
-- 1. Insertar Estados
INSERT INTO public.estados (nombre, color) VALUES 
('Abierto', '#22c55e'),
('En Progreso', '#3b82f6'),
('Cerrado', '#64748b');

-- 2. Insertar Prioridades
INSERT INTO public.prioridades (nombre, orden) VALUES 
('Baja', 1),
('Media', 2),
('Alta', 3);
```

---

## 8. Gestión de Organigrama (Grupos y Miembros) ⭐
Creación de departamentos y asignación de personal.

```sql
-- 1. Crear un Grupo (Soporte Técnico)
INSERT INTO public.grupos (nombre, descripcion, creador_id)
VALUES (
  'Soporte Técnico', 
  'Departamento de atención a incidentes', 
  (SELECT id FROM public.usuarios WHERE email = 'alumno_seguridad@universidad.edu' LIMIT 1)
);

-- 2. Agregar Miembro al Grupo
INSERT INTO public.grupo_miembros (grupo_id, usuario_id)
VALUES (
  (SELECT id FROM public.grupos WHERE nombre = 'Soporte Técnico' LIMIT 1),
  (SELECT id FROM public.usuarios WHERE email = 'alumno_seguridad@universidad.edu' LIMIT 1)
);
```

---

## 9. Ciclo de Vida del Ticket ⭐
Flujo completo desde la incidencia hasta la atención.

```sql
-- 1. Crear un Ticket
INSERT INTO public.tickets (grupo_id, titulo, descripcion, autor_id, estado_id, priority_id)
VALUES (
  (SELECT id FROM public.grupos WHERE nombre = 'Soporte Técnico' LIMIT 1),
  'Fallo en servidor de base de datos',
  'No se puede conectar al cluster principal desde la DMZ',
  (SELECT id FROM public.usuarios WHERE email = 'alumno_seguridad@universidad.edu' LIMIT 1),
  (SELECT id FROM public.estados WHERE nombre = 'Abierto' LIMIT 1),
  (SELECT id FROM public.prioridades WHERE nombre = 'Alta' LIMIT 1)
);

-- 2. Asignar Ticket y Cambiar Estado
UPDATE public.tickets
SET asignado_id = (SELECT id FROM public.usuarios WHERE email = 'alumno_seguridad@universidad.edu' LIMIT 1),
    estado_id = (SELECT id FROM public.estados WHERE nombre = 'En Progreso' LIMIT 1)
WHERE titulo = 'Fallo en servidor de base de datos';
```

---

## 10. Interacción y Seguimiento ⭐
Colaboración y auditoría de cambios.

```sql
-- 1. Agregar un Comentario
INSERT INTO public.comentarios (ticket_id, autor_id, contenido)
VALUES (
  (SELECT id FROM public.tickets WHERE titulo = 'Fallo en servidor de base de datos' LIMIT 1),
  (SELECT id FROM public.usuarios WHERE email = 'alumno_seguridad@universidad.edu' LIMIT 1),
  'Se ha iniciado la revisión de los logs del firewall.'
);

-- 2. Consultar Historial de un Ticket
SELECT u.username, h.accion, h.detalles, h.creado_en
FROM public.historial_tickets h
JOIN public.usuarios u ON h.usuario_id = u.id
WHERE h.ticket_id = (SELECT id FROM public.tickets WHERE titulo = 'Fallo en servidor de base de datos' LIMIT 1)
ORDER BY h.creado_en DESC;
```

---

## 11. Reportes y Estadísticas de Seguridad ⭐
Consultas agregadas para la toma de decisiones.

```sql
-- 1. Resumen de Tickets por Estado
SELECT e.nombre as estado, COUNT(t.id) as total
FROM public.tickets t
JOIN public.estados e ON t.estado_id = e.id
GROUP BY e.nombre;

-- 2. Usuarios más activos (por reporte de tickets)
SELECT u.username, COUNT(t.id) as tickets_creados
FROM public.usuarios u
JOIN public.tickets t ON u.id = t.autor_id
GROUP BY u.username
ORDER BY tickets_creados DESC;
```
