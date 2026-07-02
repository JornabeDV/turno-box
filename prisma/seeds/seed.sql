-- ============================================================
-- SEED DE DESARROLLO — CrossFit Turnos
-- Ejecutar DESPUÉS de schema.sql
-- ============================================================
-- Credenciales:
--   admin@crossfit.demo  / admin123
--   coach@crossfit.demo  / coach123
--   alumno@crossfit.demo / alumno123
-- ============================================================

-- UUIDs fijos para poder referenciar entre tablas
-- gym:    gym-demo-001
-- admin:  user-admin-001
-- coach:  user-coach-001
-- alumno: user-alumno-001

-- ─── LIMPIEZA PREVIA (idempotente) ──────────────────────────
-- Se borra en orden inverso de FK para no violar restricciones
DELETE FROM credit_transactions  WHERE "gymId" = 'gym-demo-001';
DELETE FROM user_credit_balances WHERE "gymId" = 'gym-demo-001';
DELETE FROM payments             WHERE "gymId" = 'gym-demo-001';
DELETE FROM bookings             WHERE "userId" IN ('user-admin-001','user-coach-001','user-alumno-001');
DELETE FROM gym_classes          WHERE "gymId" = 'gym-demo-001';
DELETE FROM packs                WHERE "gymId" = 'gym-demo-001';
DELETE FROM users                WHERE "gymId" = 'gym-demo-001'
                                    OR email IN ('admin@crossfit.demo','coach@crossfit.demo','alumno@crossfit.demo');
DELETE FROM gyms                 WHERE id = 'gym-demo-001';

-- ─── GYM ────────────────────────────────────────────────────
INSERT INTO gyms (id, name, slug, address, phone, timezone, "cancelWindowHours", "createdAt", "updatedAt")
VALUES (
  'gym-demo-001',
  'CrossFit Demo',
  'crossfit-demo',
  'Av. Siempreviva 742, Buenos Aires',
  '+54 11 1234-5678',
  'America/Argentina/Buenos_Aires',
  2,
  NOW(),
  NOW()
);

-- ─── USUARIOS ───────────────────────────────────────────────
INSERT INTO users (id, name, email, "emailVerified", role, "passwordHash", "isActive", "gymId", "createdAt", "updatedAt")
VALUES
  (
    'user-admin-001',
    'Admin Demo',
    'admin@crossfit.demo',
    NOW(),
    'ADMIN',
    '$2b$12$CejPAJ63247Gus044XfzUeic0WrhxKGhENTWeUHyZuLmDn507J3R2',
    true,
    'gym-demo-001',
    NOW(),
    NOW()
  ),
  (
    'user-coach-001',
    'Lucas Pérez',
    'coach@crossfit.demo',
    NOW(),
    'COACH',
    '$2b$12$.ezAHGQ2JLFkJ9dWRA9RxObUAzz2v0nNDuvcINhNih7gD3v/Jhode',
    true,
    'gym-demo-001',
    NOW(),
    NOW()
  ),
  (
    'user-alumno-001',
    'María González',
    'alumno@crossfit.demo',
    NOW(),
    'STUDENT',
    '$2b$12$4OW9hHc9YaZW7FO6U5J0U.nnV6f99JXzVSSMc.4J1TDyruUGYqjp6',
    true,
    'gym-demo-001',
    NOW(),
    NOW()
  );

-- ─── CLASES ─────────────────────────────────────────────────
INSERT INTO gym_classes (id, name, "dayOfWeek", "startTime", "endTime", "maxCapacity", color, "gymId", "coachId", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'CrossFit WOD',  'MONDAY',    '07:00', '08:00', 12, '#f97316', 'gym-demo-001', 'user-coach-001', true, NOW(), NOW()),
  (gen_random_uuid(), 'CrossFit WOD',  'MONDAY',    '18:00', '19:00', 15, '#f97316', 'gym-demo-001', 'user-coach-001', true, NOW(), NOW()),
  (gen_random_uuid(), 'Weightlifting', 'MONDAY',    '19:30', '21:00',  8, '#10b981', 'gym-demo-001', 'user-coach-001', true, NOW(), NOW()),
  (gen_random_uuid(), 'CrossFit WOD',  'TUESDAY',   '07:00', '08:00', 12, '#f97316', 'gym-demo-001', 'user-coach-001', true, NOW(), NOW()),
  (gen_random_uuid(), 'Open Box',      'TUESDAY',   '10:00', '12:00', 20, '#3b82f6', 'gym-demo-001', 'user-coach-001', true, NOW(), NOW()),
  (gen_random_uuid(), 'CrossFit WOD',  'WEDNESDAY', '07:00', '08:00', 12, '#f97316', 'gym-demo-001', 'user-coach-001', true, NOW(), NOW()),
  (gen_random_uuid(), 'CrossFit WOD',  'WEDNESDAY', '18:00', '19:00', 15, '#f97316', 'gym-demo-001', 'user-coach-001', true, NOW(), NOW()),
  (gen_random_uuid(), 'CrossFit WOD',  'THURSDAY',  '07:00', '08:00', 12, '#f97316', 'gym-demo-001', 'user-coach-001', true, NOW(), NOW()),
  (gen_random_uuid(), 'Mobility',      'THURSDAY',  '19:30', '20:30', 10, '#8b5cf6', 'gym-demo-001', 'user-coach-001', true, NOW(), NOW()),
  (gen_random_uuid(), 'CrossFit WOD',  'FRIDAY',    '07:00', '08:00', 12, '#f97316', 'gym-demo-001', 'user-coach-001', true, NOW(), NOW()),
  (gen_random_uuid(), 'CrossFit WOD',  'FRIDAY',    '18:00', '19:00', 15, '#f97316', 'gym-demo-001', 'user-coach-001', true, NOW(), NOW()),
  (gen_random_uuid(), 'Open Box',      'SATURDAY',  '09:00', '11:00', 25, '#3b82f6', 'gym-demo-001', 'user-coach-001', true, NOW(), NOW());

-- ─── PACKS ──────────────────────────────────────────────────
INSERT INTO packs (id, "gymId", name, credits, price, currency, "validityDays", "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES
  ('pack-8-gym-demo-001',  'gym-demo-001', 'Pack 8 clases',  8,  14000.00, 'ARS', 30, true, 0, NOW(), NOW()),
  ('pack-12-gym-demo-001', 'gym-demo-001', 'Pack 12 clases', 12, 19000.00, 'ARS', 45, true, 1, NOW(), NOW()),
  ('pack-16-gym-demo-001', 'gym-demo-001', 'Pack 16 clases', 16, 24000.00, 'ARS', 60, true, 2, NOW(), NOW());

-- ─── CRÉDITOS DEL ALUMNO ────────────────────────────────────
-- Simula un pack comprado y aprobado
INSERT INTO user_credit_balances (id, "userId", "gymId", "availableCredits", version, "updatedAt")
VALUES (
  gen_random_uuid(),
  'user-alumno-001',
  'gym-demo-001',
  10,
  1,
  NOW()
)
ON CONFLICT ("userId", "gymId") DO UPDATE SET
  "availableCredits" = 10,
  version            = user_credit_balances.version + 1,
  "updatedAt"        = NOW();

INSERT INTO credit_transactions (id, "userId", "gymId", type, amount, note, "createdAt")
VALUES (
  gen_random_uuid(),
  'user-alumno-001',
  'gym-demo-001',
  'ADJUSTMENT',
  10,
  'Créditos iniciales de demo',
  NOW()
);
