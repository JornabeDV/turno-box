-- ============================================================================
-- CREAR SUPER ADMIN DIRECTAMENTE EN LA BASE DE DATOS
-- ============================================================================
-- Este archivo contiene las queries SQL para crear o promover un Super Admin.
-- 
-- Hay dos escenarios:
--   A) Ya tenés un usuario registrado y querés convertirlo en Super Admin.
--   B) No tenés ningún usuario y querés crear el primer Super Admin desde cero.
--
-- PASOS PARA EJECUTAR:
--   1. Abrir una consola de PostgreSQL conectada a la base de datos.
--      Ej: psql -U tu_usuario -d turno_box
--   2. Copiar y pegar UNA de las queries de abajo (la que corresponda).
--   3. Verificar que se ejecutó sin errores.
--   4. El usuario puede iniciar sesión inmediatamente.
--
-- NOTAS:
--   - El rol SUPER_ADMIN no necesita gym_id (es global).
--   - Asegurate de que el email exista si usás la Opción A.
--   - La contraseña en la Opción B debe estar hasheada con bcrypt (ver nota).
-- ============================================================================


-- ============================================================================
-- OPCIÓN A: Promover un usuario existente a Super Admin
-- ============================================================================
-- Reemplazá 'tu-email@ejemplo.com' por el email real del usuario.

UPDATE users
SET
  role = 'SUPER_ADMIN',
  gym_id = NULL,
  updated_at = NOW()
WHERE email = 'tu-email@ejemplo.com';

-- Verificar que se actualizó:
SELECT id, name, email, role, gym_id FROM users WHERE email = 'tu-email@ejemplo.com';


-- ============================================================================
-- OPCIÓN B: Crear un Super Admin desde cero (INSERT)
-- ============================================================================
-- IMPORTANTE: El campo password_hash debe contener una contraseña hasheada
-- con bcrypt (cost factor 12). No podés poner la contraseña en texto plano.
--
-- Para generar el hash, usá el script Node.js que está en la misma carpeta:
--   node scripts/create-super-admin.js
--
-- O, si tenés bcrypt instalado globalmente:
--   node -e "console.log(require('bcryptjs').hashSync('TuPass123!', 12))"
--
-- Luego copiá el hash resultante en la query de abajo.

INSERT INTO users (
  id,
  name,
  email,
  email_verified,
  image,
  role,
  password_hash,
  is_active,
  birth_date,
  gym_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),                 -- id (UUID auto-generado)
  'Nombre del Super Admin',          -- name
  'superadmin@ejemplo.com',          -- email (debe ser único)
  NULL,                              -- email_verified
  NULL,                              -- image
  'SUPER_ADMIN',                     -- role
  '$2a$12$...COLOCÁ_EL_HASH_AQUÍ...', -- password_hash (bcrypt, 12 rounds)
  true,                              -- is_active
  NULL,                              -- birth_date
  NULL,                              -- gym_id (los super admins no tienen gym)
  NOW(),                             -- created_at
  NOW()                              -- updated_at
);

-- Verificar que se insertó correctamente:
SELECT id, name, email, role, gym_id FROM users WHERE email = 'superadmin@ejemplo.com';


-- ============================================================================
-- OPCIÓN C: Si querés crear también un gimnasio de prueba + su admin
-- ============================================================================
-- Este bloque crea un gym y un usuario ADMIN vinculado a ese gym.
-- Útil para testing local.

-- Paso 1: Crear el gimnasio
INSERT INTO gyms (
  id,
  name,
  slug,
  logo_url,
  address,
  phone,
  timezone,
  cancel_window_hours,
  waitlist_enabled,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Gimnasio de Prueba',
  'gym-prueba',
  NULL,
  'Dirección de prueba 123',
  '+54 11 1234-5678',
  'America/Argentina/Buenos_Aires',
  2,
  true,
  NOW(),
  NOW()
)
RETURNING id;

-- Paso 2: Tomar el ID del gym que se acaba de crear (reemplazar 'GYM_ID_AQUI')
-- y crear el admin vinculado.

INSERT INTO users (
  id,
  name,
  email,
  role,
  password_hash,
  is_active,
  gym_id,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Admin de Prueba',
  'admin@gymprueba.com',
  'ADMIN',
  '$2a$12$...COLOCÁ_EL_HASH_AQUÍ...',
  true,
  'GYM_ID_AQUI',  -- <-- reemplazar por el UUID del gym creado arriba
  NOW(),
  NOW()
);
