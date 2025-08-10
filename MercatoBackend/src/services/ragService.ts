/**
 * RAG (Retrieval-Augmented Generation) Service
 * Integrates real-time macro data (inflation, job reports, geopolitical events) into trade signals
 * 
 * This service:
 * 1. Ingests macro economic data and news
 * 2. Stores data in vector embeddings for semantic search
 * 3. Uses LLM to analyze events and generate trade signals
 * 4. Publishes signals to the strategy evaluation system
 */

import { OpenAI } from 'openai';
import { PrismaClient } from '@prisma/client';
import { getRedisClient } from '../../utils/redisClient';
import { publishActionRequired } from '../scheduler/redisStream';
import axios from 'axios';

const prisma = new PrismaClient();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export interface MacroEvent {
    id: string;
    type: 'INFLATION' | 'EMPLOYMENT' | 'GEOPOLITICAL' | 'MONETARY_POLICY' | 'ECONOMIC_INDICATOR';
    title: string;
    content: string;
    source: string;
    timestamp: Date;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    relevantAssets: string[];
    embedding?: number[];
}

export interface TradeSignal {
    signalId: string;
    eventId: string;
    asset: string;
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number; // 0-1
    reasoning: string;
    timeframe: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    generatedAt: Date;
}

class RAGService {
    private vectorDimensions = 1536; // OpenAI text-embedding-ada-002 dimensions

    /**
     * Generate embeddings for text content using OpenAI
     */
    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const response = await openai.embeddings.create({
                model: "text-embedding-ada-002",
                input: text
            });
            return response.data[0].embedding;
        } catch (error) {
            console.error('Error generating embedding:', error);
            throw error;
        }
    }

    /**
     * Store macro event with vector embedding
     */
    async storeMacroEvent(event: Omit<MacroEvent, 'id' | 'embedding'>): Promise<MacroEvent> {
        const embedding = await this.generateEmbedding(`${event.title} ${event.content}`);
        
        const storedEvent: MacroEvent = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...event,
            embedding
        };

        // Store in Redis for fast retrieval
        const redisClient = getRedisClient();
        await redisClient.setEx(
            `macro_event:${storedEvent.id}`,
            86400 * 7, // 7 days TTL
            JSON.stringify(storedEvent)
        );

        // Also store in PostgreSQL for persistence
        await prisma.$executeRaw`
            INSERT INTO macro_events (id, type, title, content, source, timestamp, impact, sentiment, relevant_assets, embedding)
            VALUES (${storedEvent.id}, ${storedEvent.type}, ${storedEvent.title}, ${storedEvent.content}, 
                    ${storedEvent.source}, ${storedEvent.timestamp}, ${storedEvent.impact}, 
                    ${storedEvent.sentiment}, ${JSON.stringify(storedEvent.relevantAssets)}, 
                    ${JSON.stringify(storedEvent.embedding)})
        `;

        console.log(`[RAG] Stored macro event: ${storedEvent.id} - ${storedEvent.title}`);
        return storedEvent;
    }

    /**
     * Find similar events using vector similarity search
     */
    async findSimilarEvents(queryText: string, limit: number = 5): Promise<MacroEvent[]> {
        const queryEmbedding = await this.generateEmbedding(queryText);
        
        // Use PostgreSQL with pgvector extension for similarity search
        const similarEvents = await prisma.$queryRaw<any[]>`
            SELECT id, type, title, content, source, timestamp, impact, sentiment, relevant_assets,
                   (embedding <-> ${JSON.stringify(queryEmbedding)}::vector) as distance
            FROM macro_events
            WHERE embedding IS NOT NULL
            ORDER BY distance
            LIMIT ${limit}
        `;

        return similarEvents.map(event => ({
            id: event.id,
            type: event.type,
            title: event.title,
            content: event.content,
            source: event.source,
            timestamp: event.timestamp,
            impact: event.impact,
            sentiment: event.sentiment,
            relevantAssets: JSON.parse(event.relevant_assets),
            embedding: JSON.parse(event.embedding)
        }));
    }

    /**
     * Generate trade signals using RAG and LLM analysis
     */
    async generateTradeSignals(event: MacroEvent): Promise<TradeSignal[]> {
        try {
            // Find similar historical events
            const similarEvents =  await this.findSimilarEvents(event.content, 3);
            
            // Prepare context for LLM
            const context = `
Current Event:
Type: ${event.type}
Title: ${event.title}
Content: ${event.content}
Impact: ${event.impact}
Sentiment: ${event.sentiment}

Similar Historical Events:
${similarEvents.map(e => `- ${e.title}: ${e.content.substring(0, 200)}...`).join('\n')}

Relevant Assets: ${event.relevantAssets.join(', ')}
            `;

            // Generate trade signals using LLM
            const completion = await openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert quantitative analyst specializing in macro event analysis for trading.
                        Analyze the provided macro economic event and generate specific, actionable trade signals.
                        
                        Consider:
                        - Historical market reactions to similar events
                        - Asset correlations and sector impacts
                        - Time horizon and confidence levels
                        - Risk-adjusted opportunities
                        
                        Respond with a JSON array of trade signals in this format:
                        [
                          {
                            "asset": "string",
                            "action": "BUY|SELL|HOLD",
                            "confidence": 0.0-1.0,
                            "reasoning": "detailed explanation",
                            "timeframe": "1d|1w|1m",
                            "impact": "HIGH|MEDIUM|LOW"
                          }
                        ]`
                    },
                    {
                        role: "user",
                        content: context
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            });

            const signalsResponse = completion.choices[0].message.content;
            if (!signalsResponse) {
                throw new Error('No response from LLM');
            }

            // Parse LLM response
            const signalsData = JSON.parse(signalsResponse);
            
            // Create TradeSignal objects
            const signals: TradeSignal[] = signalsData.map((signal: any) => ({
                signalId: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                eventId: event.id,
                asset: signal.asset,
                action: signal.action,
                confidence: signal.confidence,
                reasoning: signal.reasoning,
                timeframe: signal.timeframe,
                impact: signal.impact,
                generatedAt: new Date()
            }));

            // Store signals
            for (const signal of signals) {
                await this.storeTradeSignal(signal);
                await this.publishSignalToStrategies(signal);
            }

            console.log(`[RAG] Generated ${signals.length} trade signals for event: ${event.id}`);
            return signals;

        } catch (error) {
            console.error(`[RAG] Error generating trade signals for event ${event.id}:`, error);
            throw error;
        }
    }

    /**
     * Store trade signal
     */
    private async storeTradeSignal(signal: TradeSignal): Promise<void> {
        const redisClient = getRedisClient();
        await redisClient.setEx(
            `trade_signal:${signal.signalId}`,
            86400 * 3, // 3 days TTL
            JSON.stringify(signal)
        );

        // Store in PostgreSQL
        await prisma.$executeRaw`
            INSERT INTO trade_signals (id, event_id, asset, action, confidence, reasoning, timeframe, impact, generated_at)
            VALUES (${signal.signalId}, ${signal.eventId}, ${signal.asset}, ${signal.action}, 
                    ${signal.confidence}, ${signal.reasoning}, ${signal.timeframe}, ${signal.impact}, ${signal.generatedAt})
        `;
    }

    /**
     * Publish trade signal to strategy evaluation system
     */
    private async publishSignalToStrategies(signal: TradeSignal): Promise<void> {
        // Find strategies that might be interested in this signal
        const relevantStrategies = await prisma.strategy.findMany({
            where: {
                isActive: true,
                blocks: {
                    some: {
                        condition: {
                            indicatorType: 'MACRO_SIGNAL',
                            symbol: signal.asset
                        }
                    }
                }
            }
        });

        // Publish to action required stream for each relevant strategy
        for (const strategy of relevantStrategies) {
            await publishActionRequired({
                actionId: `macro_action_${signal.signalId}`,
                actionType: signal.action as any,
                parameters: {
                    signalId: signal.signalId,
                    confidence: signal.confidence,
                    reasoning: signal.reasoning,
                    source: 'RAG_MACRO_ANALYSIS'
                },
                strategyId: strategy.id,
                userId: strategy.userId,
                triggeringIndicator: {
                    cacheKey: `macro_signal:${signal.signalId}`,
                    indicatorType: 'MACRO_SIGNAL',
                    symbol: signal.asset,
                    interval: signal.timeframe,
                    parameters: { signalType: 'RAG_GENERATED' },
                    dataSource: 'RAG',
                    dataKey: 'macro_signal',
                    lastRefreshed: new Date().toISOString(),
                    fetchTime: new Date().toISOString()
                }
            });
        }
    }

    /**
     * Ingest inflation data and generate events
     */
    async ingestInflationData(): Promise<void> {
        try {
            // Fetch latest CPI data from FRED
            const response = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
                params: {
                    series_id: 'CPIAUCSL',
                    api_key: process.env.FRED_API_KEY,
                    file_type: 'json',
                    sort_order: 'desc',
                    limit: 1
                }
            });

            const latestCPI = response.data.observations[0];
            const cpiValue = parseFloat(latestCPI.value);
            const cpiDate = new Date(latestCPI.date);

            // Calculate year-over-year inflation
            const yearAgoResponse = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
                params: {
                    series_id: 'CPIAUCSL',
                    api_key: process.env.FRED_API_KEY,
                    file_type: 'json',
                    observation_start: new Date(cpiDate.getFullYear() - 1, cpiDate.getMonth(), cpiDate.getDate()).toISOString().split('T')[0],
                    observation_end: new Date(cpiDate.getFullYear() - 1, cpiDate.getMonth(), cpiDate.getDate()).toISOString().split('T')[0],
                    limit: 1
                }
            });

            if (yearAgoResponse.data.observations.length > 0) {
                const yearAgoCPI = parseFloat(yearAgoResponse.data.observations[0].value);
                const inflationRate = ((cpiValue - yearAgoCPI) / yearAgoCPI) * 100;

                const event: Omit<MacroEvent, 'id' | 'embedding'> = {
                    type: 'INFLATION',
                    title: `CPI Inflation Data Released: ${inflationRate.toFixed(2)}%`,
                    content: `Consumer Price Index for All Urban Consumers: All Items in U.S. City Average. Current CPI: ${cpiValue}, Year-over-year inflation rate: ${inflationRate.toFixed(2)}%. This ${inflationRate > 3 ? 'elevated' : inflationRate > 2 ? 'moderate' : 'low'} inflation reading may impact Federal Reserve monetary policy decisions and market expectations.`,
                    source: 'FRED_API',
                    timestamp: cpiDate,
                    impact: inflationRate > 4 ? 'HIGH' : inflationRate > 2.5 ? 'MEDIUM' : 'LOW',
                    sentiment: inflationRate > 3 ? 'NEGATIVE' : inflationRate < 2 ? 'POSITIVE' : 'NEUTRAL',
                    relevantAssets: ['SPY', 'TLT', 'GLD', 'DXY', 'QQQ', 'IWM']
                };

                const storedEvent = await this.storeMacroEvent(event);
                await this.generateTradeSignals(storedEvent);
            }

        } catch (error) {
            console.error('[RAG] Error ingesting inflation data:', error);
        }
    }

    /**
     * Ingest employment data and generate events
     */
    async ingestEmploymentData(): Promise<void> {
        try {
            // Fetch latest unemployment rate from FRED
            const response = await axios.get('https://api.stlouisfed.org/fred/series/observations', {
                params: {
                    series_id: 'UNRATE',
                    api_key: process.env.FRED_API_KEY,
                    file_type: 'json',
                    sort_order: 'desc',
                    limit: 2
                }
            });

            const observations = response.data.observations;
            if (observations.length >= 2) {
                const current = parseFloat(observations[0].value);
                const previous = parseFloat(observations[1].value);
                const change = current - previous;

                const event: Omit<MacroEvent, 'id' | 'embedding'> = {
                    type: 'EMPLOYMENT',
                    title: `Unemployment Rate: ${current}% (${change >= 0 ? '+' : ''}${change.toFixed(1)}%)`,
                    content: `U.S. unemployment rate is now ${current}%, representing a ${change >= 0 ? 'increase' : 'decrease'} of ${Math.abs(change).toFixed(1)} percentage points from the previous month. This ${current > 5 ? 'elevated' : current < 4 ? 'low' : 'moderate'} unemployment level indicates ${current < 4 ? 'strong' : current > 6 ? 'weak' : 'stable'} labor market conditions.`,
                    source: 'FRED_API',
                    timestamp: new Date(observations[0].date),
                    impact: Math.abs(change) > 0.3 ? 'HIGH' : Math.abs(change) > 0.1 ? 'MEDIUM' : 'LOW',
                    sentiment: change < 0 ? 'POSITIVE' : change > 0 ? 'NEGATIVE' : 'NEUTRAL',
                    relevantAssets: ['SPY', 'QQQ', 'IWM', 'XLF', 'TLT', 'DXY']
                };

                const storedEvent = await this.storeMacroEvent(event);
                await this.generateTradeSignals(storedEvent);
            }

        } catch (error) {
            console.error('[RAG] Error ingesting employment data:', error);
        }
    }

    /**
     * Ingest geopolitical events from news sources
     */
    async ingestGeopoliticalEvents(): Promise<void> {
        try {
            // This would integrate with news APIs like NewsAPI, Reuters, etc.
            // For now, we'll simulate with example events
            const geopoliticalKeywords = [
                'federal reserve', 'interest rates', 'trade war', 'sanctions',
                'election', 'central bank', 'monetary policy', 'inflation target',
                'recession', 'gdp growth', 'oil prices', 'geopolitical tension'
            ];

            // In a real implementation, you would:
            // 1. Fetch news from multiple sources
            // 2. Filter for geopolitical/economic relevance
            // 3. Analyze sentiment and impact
            // 4. Store as macro events

            console.log('[RAG] Geopolitical event ingestion would be implemented with news API integration');

        } catch (error) {
            console.error('[RAG] Error ingesting geopolitical events:', error);
        }
    }

    /**
     * Start automated macro data ingestion
     */
    async startAutomatedIngestion(): Promise<void> {
        console.log('[RAG] Starting automated macro data ingestion...');

        // Run initial ingestion
        await this.ingestInflationData();
        await this.ingestEmploymentData();
        await this.ingestGeopoliticalEvents();

        // Schedule periodic updates
        setInterval(async () => {
            await this.ingestInflationData();
        }, 24 * 60 * 60 * 1000); // Daily for CPI

        setInterval(async () => {
            await this.ingestEmploymentData();
        }, 24 * 60 * 60 * 1000); // Daily for unemployment

        setInterval(async () => {
            await this.ingestGeopoliticalEvents();
        }, 60 * 60 * 1000); // Hourly for news

        console.log('[RAG] Automated macro data ingestion scheduled');
    }
}

export const ragService = new RAGService();
