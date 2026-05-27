-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateTable
CREATE TABLE "gym_transactions" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "method" TEXT,
    "userId" TEXT,
    "paymentId" TEXT,
    "registeredBy" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gym_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gym_transactions_paymentId_key" ON "gym_transactions"("paymentId");

-- CreateIndex
CREATE INDEX "gym_transactions_gymId_date_idx" ON "gym_transactions"("gymId", "date");

-- CreateIndex
CREATE INDEX "gym_transactions_gymId_type_idx" ON "gym_transactions"("gymId", "type");

-- AddForeignKey
ALTER TABLE "gym_transactions" ADD CONSTRAINT "gym_transactions_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gym_transactions" ADD CONSTRAINT "gym_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gym_transactions" ADD CONSTRAINT "gym_transactions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN "method" TEXT;
