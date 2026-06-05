# Notificaciones Push — Box Turno

Documentación completa de todas las notificaciones push implementadas en el sistema.

---

## Arquitectura

- **Librería servidor:** `web-push`
- **Service Worker:** `@serwist/next` + registro manual fallback
- **Almacenamiento de suscripciones:** tabla `PushSubscription` en Prisma
- **Modelo de envío:** fire-and-forget en server actions; awaited en cron jobs

---

## Tabla resumen

| # | Notificación | Categoría | Destinatario | Trigger |
|---|-------------|-----------|-------------|---------|
| 1 | Reserva confirmada | Server Action | Alumno que reserva | Reserva con cupo disponible |
| 2 | En lista de espera | Server Action | Alumno que reserva | Reserva sin cupo disponible |
| 3 | Promoción desde espera | Server Action | Alumno promovido | Cancelación de otra reserva que libera cupo |
| 4 | Clase cancelada | Server Action | Alumnos con reserva | Admin cancela una clase |
| 5 | Ajuste de créditos | Server Action | Alumno afectado | Admin ajusta saldo manualmente |
| 6 | Nuevo aviso | Server Action | Todos los usuarios del gym | Admin publica un aviso |
| 7 | Abono acreditado (página de éxito) | Server Action | Alumno comprador | Pago aprobado al volver de MP |
| 8 | Abono acreditado (webhook) | Webhook | Alumno comprador | Webhook de MercadoPago: pago aprobado |
| 9 | Nuevo pago recibido | Webhook | Admins del gym | Webhook de MercadoPago: pago aprobado |
| 10 | Recordatorio de clase | Cron | Alumnos con reserva confirmada | 2 horas antes del inicio de la clase |
| 11 | Créditos vencen en 3 días | Cron | Alumnos con pagos por vencer | Diario, pagos con `expiresAt` en ~3 días |
| 12 | Créditos vencen mañana | Cron | Alumnos con pagos por vencer | Diario, pagos con `expiresAt` en ~1 día |
| 13 | Créditos vencidos | Cron | Alumnos con pagos vencidos | Diario, pagos que vencieron en las últimas 24h |
| 14 | Cumpleaños | Cron | Alumno que cumple años | Diario, alumnos con `birthDate` hoy |
| 15 | Test manual | Admin / API | Cualquier usuario | Botón en panel de admin o endpoint cron |

---

## 1. Notificaciones por acciones de usuario (Server Actions)

### 1.1 Reserva confirmada

- **Trigger:** El alumno reserva una clase con cupo disponible.
- **Archivo:** `src/actions/bookings.ts`
- **Destinatario:** `userId` del alumno que reserva.

```json
{
  "title": "Reserva confirmada ✓",
  "body": "Tu reserva fue confirmada. ¡Nos vemos en el gym!",
  "url": "/bookings",
  "tag": "booking"
}
```

**Cómo probar:** como alumno, reservar una clase que tenga cupos libres.

---

### 1.2 En lista de espera

- **Trigger:** El alumno reserva una clase que ya está completa y la lista de espera está activa.
- **Archivo:** `src/actions/bookings.ts`
- **Destinatario:** `userId` del alumno que reserva.

```json
{
  "title": "En lista de espera",
  "body": "Estás en lista de espera. Te avisaremos si se libera un lugar.",
  "url": "/bookings",
  "tag": "booking"
}
```

**Cómo probar:** como alumno, reservar una clase que esté completa (con lista de espera activa).

---

### 1.3 Promoción desde lista de espera

- **Trigger:** Un alumno cancela su reserva confirmada, liberando un cupo que se asigna automáticamente al primer alumno en lista de espera.
- **Archivo:** `src/actions/bookings.ts`
- **Destinatario:** `promotedUserId` (alumno que sube de la lista de espera a confirmado).

```json
{
  "title": "¡Conseguiste lugar! 🎉",
  "body": "Se liberó un cupo y tu reserva fue confirmada.",
  "url": "/bookings",
  "tag": "waitlist-promoted"
}
```

**Cómo probar:**
1. Llenar una clase al 100%.
2. Inscribir un alumno B en lista de espera.
3. Que el alumno A (confirmado) cancele su reserva.
4. El alumno B recibe la notificación de promoción.

---

### 1.4 Clase cancelada

- **Trigger:** El admin cancela una clase que tenía reservas confirmadas.
- **Archivo:** `src/actions/classes.ts`
- **Destinatario:** Todos los `userId` con reserva `CONFIRMED` para esa clase.

```json
{
  "title": "Clase cancelada",
  "body": "[Disciplina] ([hora]hs) fue cancelada por el gym. Contactate con nosotros si tenés dudas.",
  "url": "/",
  "tag": "class-cancelled"
}
```

**Cómo probar:** desde el panel de admin, cancelar una clase que tenga alumnos confirmados.

---

### 1.5 Ajuste de créditos

- **Trigger:** El admin ajusta manualmente el saldo de créditos de un alumno.
- **Archivo:** `src/actions/students.ts`
- **Destinatario:** `studentId` del alumno afectado.

```json
{
  "title": "El gym ajustó tu saldo",
  "body": "+3 créditos. Saldo actual: 12.",
  "url": "/credits",
  "tag": "credit-adjustment"
}
```

**Cómo probar:**
- Admin > Alumnos > seleccionar un alumno > Historial de créditos > ajustar saldo.

---

### 1.6 Nuevo aviso

- **Trigger:** El admin crea y publica un aviso/noticia (solo si `publishAt <= now`, es decir, no está programado para el futuro).
- **Archivo:** `src/actions/announcements.ts`
- **Destinatario:** Todos los usuarios del gym (`sendPushToGym`).

```json
{
  "title": "📌 [Título del aviso]",
  "body": "Primeros 100 caracteres del cuerpo...",
  "url": "/",
  "tag": "announcement"
}
```

> Si el aviso no está fijado, el título no lleva el emoji 📌.

**Cómo probar:** Admin > Novedades > Crear aviso > publicar ahora.

---

### 1.7 Abono acreditado (página de éxito)

- **Trigger:** El alumno vuelve de MercadoPago a `/packs/success` y el sistema aprueba el pago.
- **Archivo:** `src/app/(student)/packs/success/page.tsx`
- **Destinatario:** `payment.userId`.

```json
{
  "title": "Abono acreditado",
  "body": "Se sumaron [X] créditos a tu cuenta.",
  "url": "/packs",
  "tag": "payment-approved"
}
```

**Cómo probar:** completar un pago real o de prueba y llegar a la página de éxito.

---

## 2. Notificaciones por Webhooks

### 2.1 Abono acreditado (webhook MercadoPago)

- **Trigger:** Webhook de MercadoPago notifica `status: approved`.
- **Archivo:** `src/app/api/webhooks/mercadopago/route.ts`
- **Destinatario:** Alumno comprador (`payment.userId`).

```json
{
  "title": "¡Abono acreditado! 🎉",
  "body": "Se sumaron [X] créditos a tu cuenta.",
  "url": "/packs",
  "tag": "payment-approved"
}
```

> Solo se envía si el pago fue acreditado por primera vez en este webhook (evita duplicados con la success page).

**Cómo probar:** generar un pago real a través de MercadoPago y esperar el webhook.

---

### 2.2 Nuevo pago recibido (admins)

- **Trigger:** Webhook de MercadoPago notifica `status: approved`.
- **Archivo:** `src/app/api/webhooks/mercadopago/route.ts`
- **Destinatario:** Todos los admins del gym (`sendPushToGymAdmins`).

```json
{
  "title": "💰 Nuevo pago recibido",
  "body": "[Nombre del alumno] pagó $[monto]",
  "url": "/dashboard/admin/payments",
  "tag": "admin-payment"
}
```

**Cómo probar:** generar un pago real y esperar el webhook.

---

## 3. Notificaciones por Cron Jobs

Todos los cron jobs se ejecutan mediante `POST` a su endpoint y requieren el header `x-cron-secret`.

---

### 3.1 Recordatorio de clase

- **Trigger:** Cron diario que busca reservas confirmadas con clase que empieza dentro de ~2 horas.
- **Archivo:** `src/app/api/cron/class-reminders/route.ts`
- **Frecuencia:** Recomendado cada 30 minutos.
- **Ventana:** avisa entre 90 y 150 minutos antes del inicio.

```bash
curl -X POST https://TU_DOMINIO/api/cron/class-reminders \
  -H "x-cron-secret: TU_CRON_SECRET"
```

- **Destinatario:** Alumnos con reserva `CONFIRMED` para clases que empiezan dentro de la ventana.

```json
{
  "title": "Recordatorio: [Disciplina] en 2 horas ⏰",
  "body": "Tu clase de [Disciplina] empieza a las [hora]hs. ¡Preparate!",
  "url": "/bookings",
  "tag": "class-reminder"
}
```

**Cómo probar:**
1. Crear una clase que empiece dentro de 2 horas.
2. Reservar un cupo como alumno.
3. Llamar el endpoint cron manualmente.

---

### 3.2 Créditos por vencer / vencidos

- **Trigger:** Cron diario que revisa pagos aprobados próximos a vencer o recién vencidos.
- **Archivo:** `src/app/api/cron/credit-expiry-reminders/route.ts`
- **Frecuencia:** Recomendado una vez al día (ej. 09:00 AM).

```bash
curl -X POST https://TU_DOMINIO/api/cron/credit-expiry-reminders \
  -H "x-cron-secret: TU_CRON_SECRET"
```

Envía hasta **3 notificaciones distintas** según el caso:

#### 3.2a Vencen en 3 días

- **Condición:** `expiresAt` entre `hoy+3d` y `hoy+4d`.

```json
{
  "title": "⏳ Tus créditos vencen en 3 días",
  "body": "Tenés abonos que vencen pronto. Asegurate de usarlos antes de que pierdas las clases.",
  "url": "/credits",
  "tag": "credit-expiry-3d"
}
```

#### 3.2b Vencen mañana

- **Condición:** `expiresAt` entre `hoy+1d` y `hoy+2d`.

```json
{
  "title": "⚠️ Tus créditos vencen mañana",
  "body": "Mañana vencen algunos de tus abonos. Reservá tu clase ahora.",
  "url": "/credits",
  "tag": "credit-expiry-1d"
}
```

#### 3.2c Vencidos

- **Condición:** `expiresAt` entre `hoy-1d` y `hoy` (vencieron en las últimas 24h).

```json
{
  "title": "❌ Tus créditos vencieron",
  "body": "Algunos de tus abonos ya vencieron. Comprá uno nuevo para seguir entrenando.",
  "url": "/packs",
  "tag": "credit-expired"
}
```

> Si un alumno tiene pagos en múltiples rangos, recibe **una sola notificación** por rango. No se spamea.

**Cómo probar:**
1. Crear un pago aprobado para un alumno con `expiresAt` en 3 días, 1 día o ayer.
2. Llamar el endpoint cron manualmente.

---

### 3.3 Cumpleaños

- **Trigger:** Cron diario que busca alumnos cuya fecha de nacimiento coincide con el día de hoy.
- **Archivo:** `src/app/api/cron/birthday-reminders/route.ts`
- **Frecuencia:** Recomendado una vez al día (ej. 09:30 AM).

```bash
curl -X POST https://TU_DOMINIO/api/cron/birthday-reminders \
  -H "x-cron-secret: TU_CRON_SECRET"
```

- **Destinatario:** Alumnos que cumplen años hoy.

```json
{
  "title": "🎉 ¡Feliz cumpleaños, [Nombre]!",
  "body": "El equipo te desea un gran día. Vení a entrenar y festejá con nosotros.",
  "url": "/",
  "tag": "birthday-YYYY"
}
```

**Cómo probar:**
1. Editar un alumno y ponerle `birthDate` con el mes/día de hoy.
2. Llamar el endpoint cron manualmente.

---

## 4. Test manual

### 4.1 Desde el panel de admin

- **Ubicación:** Admin > Configuración > Notificaciones > botón **"Probar notificación push"**
- **Archivo:** `src/actions/push-test.ts`
- **Destinatario:** Usuario logueado (el admin que aprieta el botón).

```json
{
  "title": "🔔 Test de notificación",
  "body": "Si ves esto, las notificaciones push están funcionando correctamente.",
  "url": "/",
  "tag": "test-push"
}
```

---

### 4.2 Desde API (curl)

```bash
curl -X POST https://TU_DOMINIO/api/cron/test-push \
  -H "x-cron-secret: TU_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"userId":"ID_DEL_USUARIO"}'
```

---

## Consideraciones técnicas

### Suscripciones expiradas

Si `webpush.sendNotification` devuelve **404** o **410**, la suscripción se elimina automáticamente de la base de datos (`prisma.pushSubscription.deleteMany`).

### VAPID keys

Las tres variables deben estar configuradas en Vercel (y en `.env` local) **sin comillas**:

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BC3j...
VAPID_PRIVATE_KEY=zlAm...
VAPID_SUBJECT=mailto:admin@beebox.app
```

### Service Worker

El archivo `public/sw.js` se genera en build time. En desarrollo (`npm run dev`) no se registra ni se genera. Para testear push localmente:

```bash
npm run build
npm start
```

### Multi-dispositivo

Un usuario puede tener múltiples suscripciones (uno por cada dispositivo/navegador). Cada dispositivo debe activar el toggle de notificaciones de forma independiente.

---

*Última actualización: 2026-06-04*
