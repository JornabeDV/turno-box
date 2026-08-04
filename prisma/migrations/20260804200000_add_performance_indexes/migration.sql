-- Migración de índices de rendimiento
-- No modifica datos; solo agrega índices para reducir escaneos secuenciales.

-- User
CREATE INDEX "User_gymId_idx" ON "users"("gymId");
CREATE INDEX "User_gymId_isActive_idx" ON "users"("gymId", "isActive");
CREATE INDEX "User_gymId_role_idx" ON "users"("gymId", "role");
CREATE INDEX "User_gymId_role_isActive_idx" ON "users"("gymId", "role", "isActive");

-- NextAuth
CREATE INDEX "Account_userId_idx" ON "accounts"("userId");
CREATE INDEX "Session_userId_idx" ON "sessions"("userId");

-- PasswordResetToken: el índice sobre "token" es redundante porque ya es @unique
DROP INDEX IF EXISTS "password_reset_tokens_token_idx";
CREATE INDEX "PasswordResetToken_userId_used_idx" ON "password_reset_tokens"("userId", "used");

-- GymClass
CREATE INDEX "GymClass_gymId_dayOfWeek_isActive_deletedAt_idx" ON "gym_classes"("gymId", "dayOfWeek", "isActive", "deletedAt");
CREATE INDEX "GymClass_coachId_gymId_isActive_deletedAt_idx" ON "gym_classes"("coachId", "gymId", "isActive", "deletedAt");

-- ClassOverride
CREATE INDEX "ClassOverride_coachId_date_isCancelled_idx" ON "class_overrides"("coachId", "date", "isCancelled");

-- Booking
CREATE INDEX "Booking_classId_classDate_deletedAt_status_idx" ON "bookings"("classId", "classDate", "deletedAt", "status");
CREATE INDEX "Booking_userId_classDate_deletedAt_status_idx" ON "bookings"("userId", "classDate", "deletedAt", "status");

-- Payment
CREATE INDEX "Payment_userId_gymId_status_expiresAt_idx" ON "payments"("userId", "gymId", "status", "expiresAt");
CREATE INDEX "Payment_gymId_createdAt_idx" ON "payments"("gymId", "createdAt");
CREATE INDEX "Payment_gymId_paidAt_idx" ON "payments"("gymId", "paidAt");
CREATE INDEX "Payment_status_expiresAt_idx" ON "payments"("status", "expiresAt");

-- CreditTransaction
CREATE INDEX "CreditTransaction_paymentId_idx" ON "credit_transactions"("paymentId");

-- GymTransaction
CREATE INDEX "GymTransaction_gymId_date_type_idx" ON "gym_transactions"("gymId", "date", "type");
