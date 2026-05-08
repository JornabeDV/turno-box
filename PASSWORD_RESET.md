# Sistema de Recuperación de Contraseña

Este documento explica cómo funciona el sistema de recuperación de contraseña implementado en la aplicación CrossFit Turnos.

## Funcionamiento General

Cuando un usuario olvida su contraseña, puede seguir estos pasos:

1. **Solicitar recuperación**: El usuario ingresa su email en `/auth/forgot-password`
2. **Generar token**: El sistema crea un token único y seguro en la base de datos
3. **Enviar email**: Se envía un email con un enlace seguro para resetear la contraseña
4. **Resetear contraseña**: El usuario hace clic en el enlace y establece una nueva contraseña

## Componentes Implementados

### Páginas
- `/auth/forgot-password` - Formulario para solicitar recuperación
- `/auth/reset-password/[token]` - Página para ingresar nueva contraseña

### API Routes
- `POST /api/auth/forgot-password` - Genera token y envía email
- `POST /api/auth/reset-password` - Valida token y actualiza contraseña

### Modelo de Base de Datos
```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@map("password_reset_tokens")
}
```

## Seguridad

### Medidas Implementadas
- **Tokens únicos**: Cada token es generado con crypto.randomBytes(32) (256 bits)
- **Expiración**: Los tokens expiran en 1 hora
- **Uso único**: Los tokens se marcan como usados después del primer uso
- **Validación**: Los tokens se validan contra expiración y uso previo
- **Hashing**: Las nuevas contraseñas se hashean con bcrypt (12 rounds)
- **Sesiones invalidadas**: Al cambiar contraseña, se invalidan todas las sesiones activas

### Respuestas Genéricas
Por seguridad, el sistema siempre devuelve la misma respuesta genérica:
- "Si existe una cuenta con ese email, recibirás instrucciones para resetear tu contraseña."

Esto evita que atacantes puedan enumerar emails válidos en el sistema.

## Configuración de Email

### Servicio Utilizado: Resend
- API Key configurada en `.env`: `RESEND_API_KEY`
- Emails enviados desde: `Bee Box <noreply@bebox.com>`

### Variables de Entorno Requeridas
```env
RESEND_API_KEY="tu-api-key-de-resend"
NEXT_PUBLIC_APP_URL="https://tu-dominio.com"
```

### Template de Email
El email incluye:
- Logo de la aplicación
- Enlace seguro para resetear contraseña
- Instrucciones claras
- Información de contacto
- Diseño responsive HTML

## Flujo Técnico Detallado

### 1. Solicitud de Recuperación
```
Usuario ingresa email → POST /api/auth/forgot-password
```
- Valida formato del email
- Busca usuario activo
- Si existe, genera token único
- Guarda token en BD con expiración
- Envía email con enlace seguro

### 2. Reseteo de Contraseña
```
Usuario hace clic en enlace → GET /auth/reset-password/[token]
```
- Página carga el formulario de nueva contraseña
```
Usuario envía nueva contraseña → POST /api/auth/reset-password
```
- Valida token (existe, no usado, no expirado)
- Hashea nueva contraseña
- Actualiza usuario en BD
- Marca token como usado
- Invalida sesiones activas
- Redirige a login

## Manejo de Errores

### En Forgot Password
- Email inválido → 400 Bad Request
- Error interno → 500 Internal Server Error (loggeado)

### En Reset Password
- Datos inválidos → 400 Bad Request
- Token inválido/expirado/usado → 400 Bad Request
- Error interno → 500 Internal Server Error (loggeado)

## Logs

El sistema registra en consola:
- `[FORGOT PASSWORD] Token generado para email: token`
- `[FORGOT PASSWORD] Email enviado a email`
- `[RESET PASSWORD] Contraseña cambiada para email`

## Consideraciones de Producción

1. **Rate Limiting**: Considerar implementar límites de solicitudes por IP/email
2. **Monitoreo**: Alertas cuando hay muchos intentos fallidos
3. **Backup**: Los tokens son temporales, pero considerar backup de logs
4. **Dominio**: Configurar SPF/DKIM/DMARC para el dominio de envío
5. **HTTPS**: Asegurar que todos los enlaces usen HTTPS

## Testing

Para probar el sistema:
1. Crear usuario de prueba
2. Ir a `/auth/forgot-password`
3. Ingresar email del usuario
4. Revisar logs para ver el enlace generado
5. Usar el enlace para resetear contraseña
6. Verificar que funciona el login con nueva contraseña