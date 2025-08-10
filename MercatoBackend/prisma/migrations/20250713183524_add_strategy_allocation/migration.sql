-- AlterTable
ALTER TABLE "PolymarketEvent" ALTER COLUMN "slug" DROP NOT NULL,
ALTER COLUMN "question" DROP NOT NULL,
ALTER COLUMN "active" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Strategy" ADD COLUMN     "allocatedAmount" DOUBLE PRECISION DEFAULT 0;
