/*
  Warnings:

  - The values [TRUCK_1T,TRUCK_3T,TRUCK_5T,TRUCK_10T,CONTAINER_TRUCK] on the enum `VehicleType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `driverCode` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `licenseNumber` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `capacityVolume` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `capacityWeight` on the `vehicles` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "VehicleCompany" AS ENUM ('KHANH_HUY', 'UNICON');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('INTERNAL', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "StatementFrequency" AS ENUM ('MONTHLY_25', 'MONTHLY_30', 'WEEKLY', 'BIMONTHLY');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'CUSTOMER_OWNER';
ALTER TYPE "UserRole" ADD VALUE 'CUSTOMER_OPS';

-- AlterEnum
BEGIN;
CREATE TYPE "VehicleType_new" AS ENUM ('TRACTOR', 'TRAILER');
ALTER TABLE "vehicles" ALTER COLUMN "vehicleType" TYPE "VehicleType_new" USING ("vehicleType"::text::"VehicleType_new");
ALTER TYPE "VehicleType" RENAME TO "VehicleType_old";
ALTER TYPE "VehicleType_new" RENAME TO "VehicleType";
DROP TYPE "VehicleType_old";
COMMIT;

-- DropIndex
DROP INDEX "drivers_driverCode_key";

-- DropIndex
DROP INDEX "drivers_licenseNumber_key";

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "hasVATInvoice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "invoiceName" TEXT,
ADD COLUMN     "statementFrequency" "StatementFrequency",
ADD COLUMN     "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "taxAddress" TEXT,
ADD COLUMN     "taxCode" TEXT;

-- AlterTable
ALTER TABLE "drivers" DROP COLUMN "driverCode",
DROP COLUMN "licenseNumber",
ADD COLUMN     "birthYear" INTEGER,
ADD COLUMN     "citizenIdImages" TEXT[],
ADD COLUMN     "hometown" TEXT,
ADD COLUMN     "licenseImages" TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "userType" "UserType" NOT NULL DEFAULT 'INTERNAL';

-- AlterTable
ALTER TABLE "vehicles" DROP COLUMN "capacityVolume",
DROP COLUMN "capacityWeight",
ADD COLUMN     "company" "VehicleCompany" NOT NULL DEFAULT 'UNICON',
ADD COLUMN     "inspectionExpiryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "inspectionImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "insuranceExpiryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "insuranceImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "manufacturingYear" INTEGER,
ADD COLUMN     "operationExpiryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "registrationImages" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
