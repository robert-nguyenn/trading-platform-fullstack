-- CreateEnum
CREATE TYPE "StrategyBlockType" AS ENUM ('ROOT', 'WEIGHT', 'ASSET', 'GROUP', 'CONDITION_IF', 'FILTER', 'ACTION');

-- CreateEnum
CREATE TYPE "Operator" AS ENUM ('EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN_OR_EQUAL', 'CROSSES_ABOVE', 'CROSSES_BELOW');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('BUY', 'SELL', 'NOTIFY', 'REBALANCE', 'LOG_MESSAGE');

-- CreateTable
CREATE TABLE "Strategy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "rootBlockId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Strategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyBlock" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "blockType" "StrategyBlockType" NOT NULL,
    "parameters" JSONB NOT NULL,
    "parentId" TEXT,
    "conditionId" TEXT,
    "actionId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategyBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Condition" (
    "id" TEXT NOT NULL,
    "indicatorType" TEXT NOT NULL,
    "dataSource" TEXT,
    "dataKey" TEXT,
    "symbol" TEXT,
    "interval" TEXT,
    "parameters" JSONB NOT NULL,
    "operator" "Operator" NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "targetIndicatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "actionType" "ActionType" NOT NULL,
    "parameters" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Strategy_rootBlockId_key" ON "Strategy"("rootBlockId");

-- CreateIndex
CREATE INDEX "StrategyBlock_strategyId_idx" ON "StrategyBlock"("strategyId");

-- CreateIndex
CREATE INDEX "StrategyBlock_parentId_idx" ON "StrategyBlock"("parentId");

-- CreateIndex
CREATE INDEX "StrategyBlock_conditionId_idx" ON "StrategyBlock"("conditionId");

-- CreateIndex
CREATE INDEX "StrategyBlock_actionId_idx" ON "StrategyBlock"("actionId");

-- CreateIndex
CREATE INDEX "Condition_indicatorType_symbol_interval_idx" ON "Condition"("indicatorType", "symbol", "interval");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Strategy" ADD CONSTRAINT "Strategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Strategy" ADD CONSTRAINT "Strategy_rootBlockId_fkey" FOREIGN KEY ("rootBlockId") REFERENCES "StrategyBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyBlock" ADD CONSTRAINT "StrategyBlock_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyBlock" ADD CONSTRAINT "StrategyBlock_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StrategyBlock"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "StrategyBlock" ADD CONSTRAINT "StrategyBlock_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "Condition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyBlock" ADD CONSTRAINT "StrategyBlock_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Condition" ADD CONSTRAINT "Condition_targetIndicatorId_fkey" FOREIGN KEY ("targetIndicatorId") REFERENCES "Condition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add the tradingID column
ALTER TABLE "User" ADD COLUMN "tradingID" TEXT;

-- Add a unique index for tradingID
CREATE UNIQUE INDEX "User_tradingID_key" ON "User"("tradingID");