-- CreateEnum
CREATE TYPE "DebtType" AS ENUM ('FREIGHT', 'ADVANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('UNPAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentTermType" AS ENUM ('DAYS', 'MONTHS');

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "paymentTermDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "paymentTermType" "PaymentTermType" NOT NULL DEFAULT 'DAYS';

-- CreateTable
CREATE TABLE "debts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "debtType" "DebtType" NOT NULL,
    "debtMonth" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "documentLink" TEXT,
    "invoiceImages" TEXT[],
    "notes" TEXT,
    "recognitionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "DebtStatus" NOT NULL DEFAULT 'UNPAID',
    "paidAmount" DECIMAL(15,2),
    "paidDate" TIMESTAMP(3),
    "paymentProofImages" TEXT[],
    "paymentNotes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "debts_customerId_debtMonth_idx" ON "debts"("customerId", "debtMonth");

-- CreateIndex
CREATE INDEX "debts_status_dueDate_idx" ON "debts"("status", "dueDate");

-- CreateIndex
CREATE INDEX "debts_debtMonth_idx" ON "debts"("debtMonth");

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
