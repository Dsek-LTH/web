-- AlterTable
ALTER TABLE "members" ADD COLUMN     "stripe_customer_id" TEXT;
ALTER TABLE "consumable" ADD COLUMN     "stripe_intent_id" TEXT;

