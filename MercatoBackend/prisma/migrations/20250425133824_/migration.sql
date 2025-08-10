/*
  Warnings:

  - You are about to drop the column `tradingID` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tradingId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_tradingID_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "tradingID",
ADD COLUMN     "tradingId" TEXT;

-- CreateTable
CREATE TABLE "PolymarketEvent" (
    "id" INTEGER NOT NULL,
    "ticker" TEXT,
    "slug" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "active" BOOLEAN NOT NULL,
    "closed" BOOLEAN NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "volume" DOUBLE PRECISION NOT NULL,
    "liquidity" DOUBLE PRECISION NOT NULL,
    "tags" JSONB NOT NULL,
    "rawData" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolymarketEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_tradingId_key" ON "User"("tradingId");
