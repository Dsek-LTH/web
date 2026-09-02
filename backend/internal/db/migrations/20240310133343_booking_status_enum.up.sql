/*
 Warnings:
 
 - The `status` column on the `booking_requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.
 
 */
-- CreateEnum
CREATE TYPE "BookingRequestStatus" AS ENUM ('ACCEPTED', 'DENIED', 'PENDING');
-- AlterTable
ALTER TABLE "booking_requests"
ALTER COLUMN "status" TYPE "BookingRequestStatus" USING "status"::text::"BookingRequestStatus",
  ALTER COLUMN "status"
SET NOT NULL,
  ALTER COLUMN "status"
SET DEFAULT 'PENDING';