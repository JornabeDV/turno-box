# Deuda técnica: eficiencia de base de datos

> Documento vivo con las optimizaciones de base de datos ya aplicadas y las que quedan pendientes.
> El objetivo es reducir horas de actividad y cantidad de conexiones en Neon (plan gratuito).

## Configuración requerida en `.env`

```env
# App / runtime: usa el pooler de Neon
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.neon.tech/db?sslmode=require"

# Migraciones / CLI: usa el endpoint directo de Neon
DIRECT_URL="postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require"
```

Verificar que `src/lib/prisma.ts` use `DATABASE_URL` y `prisma.config.ts` use `DIRECT_URL`.

---

## ✅ Hecho — Fase 1: conexión e índices

- `prisma.config.ts` usa `DIRECT_URL` para migraciones/CLI.
- `src/lib/prisma.ts` simplificado a singleton clásico con adapter Neon/pg.
- `scripts/create-super-admin.js` reutiliza el singleton de `src/lib/prisma`.
- Agregados índices críticos en `schema.prisma` y migración `20260804200000_add_performance_indexes`.
- Migración aplicada en local; en producción correr `npx prisma migrate deploy`.

---

## ✅ Hecho — Fase 2: queries y transacciones críticas

- `src/actions/freezes.ts`: pausas masivas/individuales usan `updateMany`; reanudaciones agrupan updates por fecha.
- `src/actions/classes.ts:deleteClassInstanceAction`: cancelación de bookings en batch (`updateMany`, `createMany`, búsqueda única de `CONSUME`).
- `src/actions/import.ts`: importación masiva procesada en lotes de 50 filas, precarga emails, usa `createMany` y reduce transacciones.
- `src/lib/queries/metrics.ts`: reescrito con SQL agregado; ya no trae todos los bookings a memoria.

---

## ⏳ Pendiente — Fase 3: paneles, cron jobs y refinamientos

### 1. Paneles de administración

#### `src/app/dashboard/admin/page.tsx:94-103`
- **Problema:** trae todos los alumnos activos con `birthDate` para calcular cumpleaños en JS.
- **Acción:** filtrar directamente en la query (próximos 30 días) o usar raw query con cálculo de fecha.

#### `src/app/dashboard/admin/students/page.tsx:75-91`
- **Problema:** `allForMetrics` trae todos los estudiantes para contar activos y con reservas.
- **Acción:** reemplazar por `count` + `booking.groupBy`.

#### `src/actions/finances.ts:96-111` y `src/app/dashboard/admin/finances/page.tsx:57-78`
- **Problema:** 24 queries separadas para el gráfico anual.
- **Acción:** unificar en 1-2 queries con `GROUP BY date_trunc('month', date), type`.

#### `src/lib/queries/classes.ts:32-130`
- **Problema:** `getClassSlotsForDay` dispara hasta 4 queries por día; en vistas semanales son ~28 queries.
- **Acción:** crear `getClassSlotsForWeek(gymId, weekStart, userId)` que traiga toda la semana en 1-3 queries.

#### `src/app/(student)/credits/page.tsx:54-115`
- **Problema:** trae todas las `creditTxs` por pago para calcular saldo en JS.
- **Acción:** usar agregación `SUM(amount)` por `paymentId`.

#### `src/app/(student)/bookings/page.tsx:15-39`
- **Problema:** "mis turnos" sin paginación.
- **Acción:** agregar `take`/`skip` o "load more".

#### Historiales con `take: 100` fijo
- `src/app/dashboard/admin/students/[id]/history/bookings/page.tsx:37-57`
- `src/app/dashboard/admin/students/[id]/history/credits/page.tsx:37-57`
- **Acción:** implementar paginación real.

#### `src/app/dashboard/admin/coaches/page.tsx:50-72`
- **Problema:** `taughtClasses` incluye bookings anidados.
- **Acción:** usar `_count` en lugar de traer los bookings.

#### `src/app/dashboard/admin/news/page.tsx:17-20`
- **Problema:** anuncios sin `take`.
- **Acción:** agregar `take: 50` o paginación.

#### `src/app/dashboard/admin/settings/page.tsx:17-42`
- **Problema:** dos `gym.findUnique` para el mismo gym.
- **Acción:** unificar en una sola query.

#### `dashboard/admin/classes/[id]/page.tsx` y `dashboard/admin/coaches/[id]/page.tsx`
- **Problema:** `generateMetadata` repite la query principal del componente.
- **Acción:** usar `unstable_cache` o metadata genérica.

### 2. Cron jobs

#### `src/app/api/cron/weekly-report/route.ts` y `monthly-report/route.ts`
- **Problema:** no tienen idempotencia; si el cron se repite, reenvían reportes.
- **Acción:** crear tabla `sent_report(gymId, period, type, sentAt)` con unique correspondiente.

#### `src/app/api/cron/class-reminders/route.ts`
- **Problema:** filtra por `classDate` sin índice adecuado; no filtra por `gymId`; no hay control de duplicados.
- **Acción:** agregar `@@index([classDate, status, deletedAt])`, filtrar por rango exacto, crear tabla `sent_reminder(bookingId, type, sentAt)`.

#### `src/app/api/cron/birthday-reminders/route.ts`
- **Problema:** usa `EXTRACT(MONTH/DAY FROM birthDate)` que no aprovecha índices B-tree.
- **Acción:** agregar columnas computadas `birthMonth`/`birthDay` con índice, o índice funcional en PostgreSQL; agregar idempotencia.

#### `src/app/api/cron/credit-expiry-reminders/route.ts`
- **Problema:** filtra por `status + expiresAt` sin índice adecuado; no filtra por `gymId`; no hay idempotencia.
- **Acción:** usar índice `@@index([status, expiresAt])` o parcial; agregar `sent_reminder`.

### 3. Webhooks y autenticación

#### `src/app/api/webhooks/mercadopago/route.ts`
- **Problema:** consulta el pago dos veces (en route y en `approvePayment`).
- **Acción:** refactorizar `approvePayment` para aceptar el objeto `payment` ya cargado.
- **Acción opcional:** tabla `webhook_event_log` para cortar reintentos sin llamar a MP.

#### `src/app/api/reset-password/route.ts`
- **Problema:** race condition al marcar token como usado.
- **Acción:** usar `updateMany({ where: { token, used: false } })` y abortar si `count === 0`.

#### `src/app/api/forgot-password/route.ts`
- **Problema:** acumula tokens sin rate limit.
- **Acción:** limitar a 1 token activo por usuario; agregar rate limit por IP/email.

### 4. Caché y revalidaciones

- Reemplazar `revalidatePath` masivo por `revalidateTag` con tags coherentes (`gym-{gymId}`, `class-{classId}`).
- Revisar `export const dynamic = "force-dynamic"` generalizado; evaluar qué páginas pueden cachearse.

### 5. Índices adicionales (baja prioridad)

- Índice parcial en `User` para cumpleaños:
  ```sql
  CREATE INDEX "users_birthday_idx"
  ON users ((EXTRACT(MONTH FROM "birthDate")), (EXTRACT(DAY FROM "birthDate")))
  WHERE role = 'STUDENT' AND "isActive" = true AND "birthDate" IS NOT NULL;
  ```
- Índice parcial en `Announcement` para anuncios activos.
- Índice GIN trigram para búsqueda insensible de alumnos por nombre/email si el volumen crece:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX "users_search_trgm_idx"
  ON users USING gin (name gin_trgm_ops, email gin_trgm_ops);
  ```

### 6. Limpieza menor

- Revisar `findUnique`/`findFirst` sin `select` que traen columnas innecesarias.
- Normalizar email a minúsculas en login (`src/lib/auth.ts:32`).
- `src/app/api/push/subscribe/route.ts`: cambiar `deleteMany` por `delete` aprovechando que `endpoint` es `@unique`.

---

## Cómo priorizar

1. **Alto impacto inmediato:** paneles admin (cumpleaños, students, finanzas) y cron jobs idempotencia.
2. **Medio impacto:** query semanal de clases, paginación de historiales, credits page.
3. **Bajo impacto:** limpieza de selects, caché, índices parciales.

---

## Comandos útiles

```bash
# Validar schema
npx prisma validate

# Generar cliente
npx prisma generate

# Aplicar migraciones en producción (sin datos perdidos)
npx prisma migrate deploy

# Ver índices creados en PostgreSQL
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```
