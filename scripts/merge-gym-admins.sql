-- ============================================================================
-- MERGE DE DOS ADMINS DE UN MISMO GIMNASIO (ejecutar en Neon / PostgreSQL)
-- ============================================================================
--
-- Transfiere TODO lo asociado a anabelenbeja25@gmail.com hacia
-- rm.box2021@gmail.com y luego elimina el primer usuario.
--
-- Al final queda un solo admin con email rm.box2021@gmail.com.
--
-- IMPORTANTE: el bloque DO corre de forma atómica (rollback automático si falla).
-- HACÉ UN BACKUP DE LA BASE DE DATOS ANTES DE EJECUTAR.
-- ============================================================================

DO $$
DECLARE
  v_source_id TEXT;
  v_target_id TEXT;
  v_gym_id TEXT;
  v_source_balance_id TEXT;
  v_source_credits INT;
  v_target_balance_id TEXT;
  v_target_credits INT;
BEGIN
  -- ── Buscar usuarios ──────────────────────────────────────────────────────
  SELECT id INTO v_source_id FROM users WHERE email = 'anabelenbeja25@gmail.com';
  SELECT id INTO v_target_id FROM users WHERE email = 'rm.box2021@gmail.com';

  IF v_source_id IS NULL THEN
    RAISE EXCEPTION 'No existe el usuario anabelenbeja25@gmail.com';
  END IF;

  IF v_target_id IS NULL THEN
    RAISE EXCEPTION 'No existe el usuario rm.box2021@gmail.com';
  END IF;

  IF v_source_id = v_target_id THEN
    RAISE EXCEPTION 'Source y target son el mismo usuario';
  END IF;

  -- ── Validar que ambos sean ADMIN del mismo gimnasio ───────────────────────
  SELECT "gymId" INTO v_gym_id FROM users WHERE id = v_source_id;

  IF v_gym_id IS NULL THEN
    RAISE EXCEPTION 'El usuario anabelenbeja25@gmail.com no tiene gimnasio asignado';
  END IF;

  IF (SELECT "gymId" FROM users WHERE id = v_target_id) IS DISTINCT FROM v_gym_id THEN
    RAISE EXCEPTION 'Los dos admins no pertenecen al mismo gimnasio';
  END IF;

  IF (SELECT role FROM users WHERE id = v_source_id) != 'ADMIN' THEN
    RAISE EXCEPTION 'anabelenbeja25@gmail.com no tiene role ADMIN';
  END IF;

  IF (SELECT role FROM users WHERE id = v_target_id) != 'ADMIN' THEN
    RAISE EXCEPTION 'rm.box2021@gmail.com no tiene role ADMIN';
  END IF;

  -- ── Transferir relaciones de User ────────────────────────────────────────
  UPDATE gym_classes          SET "coachId" = v_target_id WHERE "coachId" = v_source_id;
  UPDATE payments             SET "userId"  = v_target_id WHERE "userId"  = v_source_id;
  UPDATE credit_transactions  SET "userId"  = v_target_id WHERE "userId"  = v_source_id;
  UPDATE gym_transactions     SET "userId"  = v_target_id WHERE "userId"  = v_source_id;
  UPDATE bookings             SET "userId"  = v_target_id WHERE "userId"  = v_source_id;
  UPDATE credit_freezes       SET "userId"  = v_target_id WHERE "userId"  = v_source_id;
  UPDATE push_subscriptions   SET "userId"  = v_target_id WHERE "userId"  = v_source_id;
  UPDATE accounts             SET "userId"  = v_target_id WHERE "userId"  = v_source_id;
  UPDATE sessions             SET "userId"  = v_target_id WHERE "userId"  = v_source_id;
  UPDATE password_reset_tokens SET "userId" = v_target_id WHERE "userId" = v_source_id;

  -- ── Actualizar campos de texto que guardan el ID del admin ─────────────────
  UPDATE gym_transactions SET "registeredBy" = v_target_id WHERE "registeredBy" = v_source_id;
  UPDATE credit_freezes   SET "createdBy"    = v_target_id WHERE "createdBy"    = v_source_id;

  -- ── Mergear UserCreditBalance (@@unique([userId, gymId])) ──────────────────
  SELECT id, "availableCredits"
    INTO v_source_balance_id, v_source_credits
    FROM user_credit_balances
   WHERE "userId" = v_source_id AND "gymId" = v_gym_id;

  SELECT id, "availableCredits"
    INTO v_target_balance_id, v_target_credits
    FROM user_credit_balances
   WHERE "userId" = v_target_id AND "gymId" = v_gym_id;

  IF v_source_balance_id IS NOT NULL THEN
    IF v_target_balance_id IS NOT NULL THEN
      -- Sumar créditos del source al target y eliminar el balance duplicado
      UPDATE user_credit_balances
         SET "availableCredits" = v_target_credits + v_source_credits,
             version = version + 1,
             "updatedAt" = NOW()
       WHERE id = v_target_balance_id;

      DELETE FROM user_credit_balances WHERE id = v_source_balance_id;
    ELSE
      -- El target no tenía balance: transferir el del source
      UPDATE user_credit_balances
         SET "userId" = v_target_id,
             "updatedAt" = NOW()
       WHERE id = v_source_balance_id;
    END IF;
  END IF;

  -- ── Opcional: copiar nombre/contraseña del source al target ───────────────
  -- Descomentar solo si querés que el admin final conserve el nombre o
  -- la contraseña de anabelenbeja25@gmail.com. Por defecto se conserva el
  -- target tal cual (la contraseña que usa rm.box2021@gmail.com).
  --
  -- UPDATE users
  --    SET name = COALESCE((SELECT name FROM users WHERE id = v_source_id), name),
  --        "passwordHash" = COALESCE((SELECT "passwordHash" FROM users WHERE id = v_source_id), "passwordHash")
  --  WHERE id = v_target_id;

  -- ── Eliminar el admin duplicado ────────────────────────────────────────────
  DELETE FROM users WHERE id = v_source_id;

  RAISE NOTICE 'Merge completado. Admin unificado: rm.box2021@gmail.com (%)', v_target_id;
END $$;
