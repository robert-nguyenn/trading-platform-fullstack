-- CreateTable
CREATE TABLE "MacroEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "impact" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "relevantAssets" JSONB NOT NULL,
    "embedding" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MacroEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeSignal" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BacktestResult" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "initialCapital" DOUBLE PRECISION NOT NULL,
    "finalValue" DOUBLE PRECISION NOT NULL,
    "totalReturn" DOUBLE PRECISION NOT NULL,
    "annualizedReturn" DOUBLE PRECISION NOT NULL,
    "sharpeRatio" DOUBLE PRECISION,
    "maxDrawdown" DOUBLE PRECISION,
    "winRate" DOUBLE PRECISION,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "winningTrades" INTEGER NOT NULL DEFAULT 0,
    "losingTrades" INTEGER NOT NULL DEFAULT 0,
    "avgWin" DOUBLE PRECISION,
    "avgLoss" DOUBLE PRECISION,
    "parameters" JSONB NOT NULL,
    "trades" JSONB NOT NULL,
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BacktestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "cash" DOUBLE PRECISION NOT NULL,
    "positions" JSONB NOT NULL,
    "dayChange" DOUBLE PRECISION,
    "dayChangePercent" DOUBLE PRECISION,
    "unrealizedPnl" DOUBLE PRECISION,
    "realizedPnl" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceMetrics" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "dayReturn" DOUBLE PRECISION NOT NULL,
    "cumulativeReturn" DOUBLE PRECISION NOT NULL,
    "sharpeRatio" DOUBLE PRECISION,
    "volatility" DOUBLE PRECISION,
    "maxDrawdown" DOUBLE PRECISION,
    "beta" DOUBLE PRECISION,
    "alpha" DOUBLE PRECISION,
    "sortino" DOUBLE PRECISION,
    "calmar" DOUBLE PRECISION,
    "var95" DOUBLE PRECISION,
    "var99" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MacroEvent_type_timestamp_idx" ON "MacroEvent"("type", "timestamp");

-- CreateIndex
CREATE INDEX "MacroEvent_impact_idx" ON "MacroEvent"("impact");

-- CreateIndex
CREATE INDEX "TradeSignal_asset_generatedAt_idx" ON "TradeSignal"("asset", "generatedAt");

-- CreateIndex
CREATE INDEX "TradeSignal_action_confidence_idx" ON "TradeSignal"("action", "confidence");

-- CreateIndex
CREATE INDEX "BacktestResult_strategyId_createdAt_idx" ON "BacktestResult"("strategyId", "createdAt");

-- CreateIndex
CREATE INDEX "PortfolioHistory_userId_timestamp_idx" ON "PortfolioHistory"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "PerformanceMetrics_strategyId_date_idx" ON "PerformanceMetrics"("strategyId", "date");

-- CreateIndex
CREATE INDEX "PerformanceMetrics_userId_date_idx" ON "PerformanceMetrics"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceMetrics_strategyId_date_key" ON "PerformanceMetrics"("strategyId", "date");

-- AddForeignKey
ALTER TABLE "TradeSignal" ADD CONSTRAINT "TradeSignal_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "MacroEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BacktestResult" ADD CONSTRAINT "BacktestResult_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioHistory" ADD CONSTRAINT "PortfolioHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceMetrics" ADD CONSTRAINT "PerformanceMetrics_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceMetrics" ADD CONSTRAINT "PerformanceMetrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
