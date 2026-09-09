-- AlterTable
ALTER TABLE "orders" ADD COLUMN "customer_email" TEXT;
ALTER TABLE "orders" ADD COLUMN "coupon_code" TEXT;

-- CreateIndex
CREATE INDEX "orders_customerEmail_couponCode_idx" ON "orders"("customer_email", "coupon_code");
