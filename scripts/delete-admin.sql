-- ============================================================================
-- ELIMINAR UN ADMIN VACÍO DEL MISMO GIMNASIO
-- ============================================================================
--
-- Elimina el usuario nuevoadmin@mail.com que es ADMIN del mismo gimnasio
-- que rm.box2021@gmail.com. Asume que el admin no tiene datos asociados.
--
-- Si tuviera datos (reservas, pagos, etc.), los ON DELETE CASCADE o SET NULL
-- de las relaciones se aplicarían automáticamente.
-- ============================================================================

DO $$
DECLARE
  v_admin_id TEXT;
  v_admin_gym_id TEXT;
  v_target_gym_id TEXT;
BEGIN
  -- Buscar el admin a eliminar
  SELECT id INTO v_admin_id FROM users WHERE email = 'nuevoadmin@mail.com';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No existe el usuario nuevoadmin@mail.com';
  END IF;

  IF (SELECT role FROM users WHERE id = v_admin_id) != 'ADMIN' THEN
    RAISE EXCEPTION 'nuevoadmin@mail.com no tiene role ADMIN';
  END IF;

  -- Verificar que pertenece al mismo gimnasio que rm.box2021@gmail.com
  SELECT "gymId" INTO v_admin_gym_id FROM users WHERE id = v_admin_id;
  SELECT "gymId" INTO v_target_gym_id FROM users WHERE email = 'rm.box2021@gmail.com';

  IF v_admin_gym_id IS DISTINCT FROM v_target_gym_id THEN
    RAISE EXCEPTION 'nuevoadmin@mail.com no pertenece al mismo gimnasio que rm.box2021@gmail.com';
  END IF;

  -- Eliminar el admin
  DELETE FROM users WHERE id = v_admin_id;

  RAISE NOTICE 'Admin nuevoadmin@mail.com eliminado del gimnasio.';
END $$;
