-- CreateEnum
CREATE TYPE "ContainerType" AS ENUM ('CONTAINER_20FT', 'CONTAINER_40FT', 'CONTAINER_40HC', 'CONTAINER_45FT', 'FLATBED', 'TANK', 'REFRIGERATED', 'OPEN_TOP');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BOOKING', 'BILL_OF_LADING', 'CUSTOMS', 'DELIVERY_ORDER', 'PACKING_LIST', 'COMMERCIAL_INVOICE', 'OTHER');

-- CreateEnum
CREATE TYPE "ChargeType" AS ENUM ('FREIGHT', 'FUEL_SURCHARGE', 'DETENTION', 'DEMURRAGE', 'LOADING', 'UNLOADING', 'CUSTOMS', 'TOLL_FEE', 'PARKING', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED');

-- AlterEnum
ALTER TYPE "VehicleCompany" ADD VALUE 'RENTAL';

-- AlterEnum
BEGIN;
CREATE TYPE "VehicleStatus_new" AS ENUM ('IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE');
ALTER TABLE "vehicles" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "vehicles" ALTER COLUMN "status" TYPE "VehicleStatus_new" USING ("status"::text::"VehicleStatus_new");
ALTER TYPE "VehicleStatus" RENAME TO "VehicleStatus_old";
ALTER TYPE "VehicleStatus_new" RENAME TO "VehicleStatus";
DROP TYPE "VehicleStatus_old";
ALTER TABLE "vehicles" ALTER COLUMN "status" SET DEFAULT 'IN_USE';
COMMIT;

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_customerId_fkey";

-- DropForeignKey
ALTER TABLE "shipments" DROP CONSTRAINT "shipments_orderId_fkey";

-- AlterTable
ALTER TABLE "debts" ADD COLUMN     "invoiceId" TEXT;

-- AlterTable
ALTER TABLE "shipments" DROP COLUMN "orderId",
ADD COLUMN     "containerNumber" TEXT,
ADD COLUMN     "containerType" "ContainerType",
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "createdByType" "UserType",
ADD COLUMN     "customerId" TEXT NOT NULL,
ADD COLUMN     "specialInstructions" TEXT;

-- AlterTable
ALTER TABLE "vehicles" ALTER COLUMN "status" SET DEFAULT 'IN_USE';

-- DropTable
DROP TABLE "orders";

-- DropEnum
DROP TYPE "OrderStatus";

-- CreateTable
CREATE TABLE "shipment_documents" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "shipment_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_payments" (
    "id" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "paidDate" TIMESTAMP(3) NOT NULL,
    "proofImages" TEXT[],
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debt_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charges" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "chargeType" "ChargeType" NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "shipmentId" TEXT,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    "vatAmount" DECIMAL(15,2) NOT NULL,
    "grandTotal" DECIMAL(15,2) NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "pdfPath" TEXT,
    "paymentMethod" TEXT,
    "paymentRef" TEXT,
    "notes" TEXT,
    "paymentTerms" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "chargeId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shipment_documents_shipmentId_documentType_idx" ON "shipment_documents"("shipmentId", "documentType");

-- CreateIndex
CREATE INDEX "shipment_documents_isVerified_idx" ON "shipment_documents"("isVerified");

-- CreateIndex
CREATE INDEX "debt_payments_debtId_createdAt_idx" ON "debt_payments"("debtId", "createdAt");

-- CreateIndex
CREATE INDEX "charges_shipmentId_idx" ON "charges"("shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_customerId_invoiceDate_idx" ON "invoices"("customerId", "invoiceDate");

-- CreateIndex
CREATE INDEX "invoices_status_dueDate_idx" ON "invoices"("status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_items_chargeId_key" ON "invoice_items"("chargeId");

-- CreateIndex
CREATE INDEX "invoice_items_invoiceId_idx" ON "invoice_items"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "debts_invoiceId_key" ON "debts"("invoiceId");

-- CreateIndex
CREATE INDEX "shipments_customerId_currentStatus_idx" ON "shipments"("customerId", "currentStatus");

-- CreateIndex
CREATE INDEX "shipments_createdById_idx" ON "shipments"("createdById");

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_documents" ADD CONSTRAINT "shipment_documents_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_documents" ADD CONSTRAINT "shipment_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_documents" ADD CONSTRAINT "shipment_documents_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "debts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "charges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

