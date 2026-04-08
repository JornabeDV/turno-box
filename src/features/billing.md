Quiero que actúes como un arquitecto de software senior especializado en sistemas de pagos, SaaS B2B2C y lógica de créditos.

## 🎯 Objetivo del sistema

Permitir que:
- Los usuarios compren packs de clases (créditos)
- Cada reserva consuma 1 crédito
- Solo usuarios con créditos disponibles puedan reservar

---

## 💰 Modelo de negocio

- Packs disponibles:
  - 8 clases
  - 12 clases
  - 16 clases
- Cada clase reservada consume 1 crédito
- El gimnasio define precios por pack
- Los créditos pueden tener vencimiento (opcional, pero recomendable)

---

## ⚙️ Requisitos principales

### Pagos
- Integración con pasarela (MercadoPago)
- Pago único por pack (NO suscripción)
- Confirmación automática vía webhook

---

## 🧱 Modelo de datos (Prisma)

Diseñar tablas como:

- Pack
  - id
  - gymId
  - name (8 clases, 12 clases, etc.)
  - credits (8, 12, 16)
  - price
  - active

- UserCredits
  - id
  - userId
  - gymId
  - remainingCredits
  - totalCredits
  - expirationDate

- CreditTransaction
  - id
  - userId
  - type (PURCHASE, CONSUME, REFUND)
  - amount (+8, -1, etc.)
  - relatedBookingId (opcional)

- Payment
  - id
  - userId
  - packId
  - amount
  - status
  - provider (Stripe/MercadoPago)

IMPORTANTE:
- Todo debe ser multi-tenant (gymId)

---

## 🔄 Flujos principales

### 1. Compra de pack
- Usuario selecciona pack
- Va a checkout
- Pago exitoso → webhook
- Se acreditan los créditos automáticamente

---

### 2. Reserva de turno
- Validar que el usuario tenga créditos > 0
- Crear reserva
- Descontar 1 crédito

---

### 3. Cancelación de turno
- Si está dentro del tiempo permitido:
  - devolver crédito
- Si no:
  - perder crédito

---

### 4. Créditos vencidos
- No pueden usarse
- Deben excluirse del total disponible

---

## 🔒 Concurrencia (CRÍTICO)

- Evitar que un usuario reserve sin créditos por condiciones de carrera
- Usar transacciones en DB
- Asegurar:
  - descuento de crédito + creación de reserva en la misma transacción

---

## 🔔 Webhooks

- Escuchar eventos de pago:
  - pago aprobado
  - pago rechazado
- Acreditar créditos SOLO desde webhook (no frontend)

---

## 🧠 Lógica de negocio

- Un turno = 1 crédito
- No permitir reservas si remainingCredits = 0
- Evitar créditos negativos
- Manejar múltiples compras (acumulación de créditos)
- Soportar múltiples packs activos por usuario

---

## 🧬 Multi-tenant

- Cada gym tiene sus packs
- Precios independientes
- Créditos asociados a gym específico

---

## 📊 Panel admin

- Ver ventas de packs
- Ver créditos consumidos
- Ver usuarios activos
- Métricas:
  - ingresos
  - uso de clases

---

## 📱 UX pagos

### Cliente
- Selección simple de pack
- Mostrar:
  - cantidad de clases
  - precio
  - vencimiento

---

### Estado del usuario
- Mostrar créditos disponibles claramente:
  👉 "Te quedan 5 clases"

---

## 🚀 Escalabilidad

- Diseñar para múltiples gimnasios
- Manejar alta concurrencia en reservas
- Preparar para agregar:
  - suscripciones en el futuro
  - packs mixtos

---

## 📦 Entregables

1. Arquitectura del sistema
2. Modelo Prisma completo
3. Flujos detallados
4. Ejemplo de integración con Stripe/MercadoPago
5. Lógica de consumo de créditos con transacciones
6. Estrategia para edge cases

---

## ⚠️ Importante

- No quiero solución básica
- Quiero nivel producción SaaS real
- Evitar race conditions en créditos
- Pensar en casos reales (cancelaciones, vencimientos, múltiples compras)
- Optimizar para Vercel + Neon + Prisma

---

Si es necesario, proponer mejoras al modelo (ej: rollover de créditos, packs híbridos, etc.)