/**
 * Performance Monitoring Service
 * Tracks system performance metrics to ensure:
 * - 12k+ market events/minute processing capability
 * - Sub-30ms latency for strategy evaluation
 * - 85% Redis cache hit rate
 * - Real-time monitoring and alerting
 */

import { getRedisClient } from '../utils/redisClient';
import { EventEmitter } from 'events';

export interface PerformanceMetrics {
    // Event processing metrics
    eventsPerMinute: number;
    totalEventsProcessed: number;
    avgProcessingTime: number;
    
    // Strategy evaluation metrics
    strategiesEvaluated: number;
    avgEvaluationTime: number;
    sub30msEvaluations: number;
    evaluationLatency95p: number;
    evaluationLatency99p: number;
    
    // Cache performance
    cacheHitRate: number;
    cacheHits: number;
    cacheMisses: number;
    avgCacheResponseTime: number;
    
    // System metrics
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
    
    // Time window
    windowStart: Date;
    windowEnd: Date;
}

export interface AlertThreshold {
    metric: string;
    operator: 'greater_than' | 'less_than' | 'equals';
    value: number;
    enabled: boolean;
    alertMessage: string;
}

class PerformanceMonitor extends EventEmitter {
    private metrics: Map<string, number[]> = new Map();
    private latencyBuckets: number[] = [];
    private cacheMetrics = { hits: 0, misses: 0, responseTimes: [] as number[] };
    private eventCounts = { total: 0, lastMinute: 0, minuteStart: Date.now() };
    private isMonitoring = false;
    
    // Performance thresholds
    private thresholds: AlertThreshold[] = [
        {
            metric: 'eventsPerMinute',
            operator: 'less_than',
            value: 12000,
            enabled: true,
            alertMessage: 'Event processing rate below 12k/minute threshold'
        },
        {
            metric: 'avgEvaluationTime',
            operator: 'greater_than',
            value: 30,
            enabled: true,
            alertMessage: 'Strategy evaluation latency exceeded 30ms threshold'
        },
        {
            metric: 'cacheHitRate',
            operator: 'less_than',
            value: 0.85,
            enabled: true,
            alertMessage: 'Cache hit rate below 85% threshold'
        }
    ];

    constructor() {
        super();
        this.setupMetricsCollection();
    }

    /**
     * Start performance monitoring
     */
    startMonitoring(): void {
        if (this.isMonitoring) {
            console.log('[PerformanceMonitor] Already monitoring');
            return;
        }

        this.isMonitoring = true;
        console.log('[PerformanceMonitor] Starting performance monitoring...');

        // Reset metrics
        this.resetMetrics();

        // Start periodic metrics collection
        setInterval(() => {
            this.collectSystemMetrics();
        }, 1000); // Every second

        // Calculate and emit metrics every 10 seconds
        setInterval(() => {
            const metrics = this.calculateCurrentMetrics();
            this.checkThresholds(metrics);
            this.emit('metrics', metrics);
        }, 10000);

        // Store metrics snapshot every minute
        setInterval(() => {
            this.storeMetricsSnapshot();
        }, 60000);

        console.log('[PerformanceMonitor] Performance monitoring started');
    }

    /**
     * Stop performance monitoring
     */
    stopMonitoring(): void {
        this.isMonitoring = false;
        console.log('[PerformanceMonitor] Performance monitoring stopped');
    }

    /**
     * Record market event processing
     */
    recordEventProcessed(processingTimeMs: number): void {
        const now = Date.now();
        
        // Update event counts
        this.eventCounts.total++;
        
        // Reset minute counter if needed
        if (now - this.eventCounts.minuteStart >= 60000) {
            this.eventCounts.lastMinute = 0;
            this.eventCounts.minuteStart = now;
        }
        this.eventCounts.lastMinute++;

        // Record processing time
        this.addMetric('eventProcessingTime', processingTimeMs);
    }

    /**
     * Record strategy evaluation performance
     */
    recordStrategyEvaluation(evaluationTimeMs: number): void {
        this.addMetric('strategyEvaluationTime', evaluationTimeMs);
        this.latencyBuckets.push(evaluationTimeMs);
        
        // Keep only last 1000 evaluations for percentile calculations
        if (this.latencyBuckets.length > 1000) {
            this.latencyBuckets = this.latencyBuckets.slice(-1000);
        }
    }

    /**
     * Record cache operation
     */
    recordCacheOperation(hit: boolean, responseTimeMs: number): void {
        if (hit) {
            this.cacheMetrics.hits++;
        } else {
            this.cacheMetrics.misses++;
        }
        
        this.cacheMetrics.responseTimes.push(responseTimeMs);
        
        // Keep only last 1000 cache operations
        if (this.cacheMetrics.responseTimes.length > 1000) {
            this.cacheMetrics.responseTimes = this.cacheMetrics.responseTimes.slice(-1000);
        }
    }

    /**
     * Get current performance metrics
     */
    getCurrentMetrics(): PerformanceMetrics {
        return this.calculateCurrentMetrics();
    }

    /**
     * Get performance history
     */
    async getPerformanceHistory(hours: number = 24): Promise<PerformanceMetrics[]> {
        const redisClient = getRedisClient();
        const endTime = Date.now();
        const startTime = endTime - (hours * 60 * 60 * 1000);
        
        try {
            const keys = await redisClient.keys('performance_metrics:*');
            const metricsData = [];
            
            for (const key of keys) {
                const timestamp = parseInt(key.split(':')[1]);
                if (timestamp >= startTime && timestamp <= endTime) {
                    const data = await redisClient.get(key);
                    if (data) {
                        metricsData.push(JSON.parse(data));
                    }
                }
            }
            
            return metricsData.sort((a, b) => 
                new Date(a.windowStart).getTime() - new Date(b.windowStart).getTime()
            );
            
        } catch (error) {
            console.error('[PerformanceMonitor] Error retrieving performance history:', error);
            return [];
        }
    }

    /**
     * Add threshold for monitoring
     */
    addThreshold(threshold: AlertThreshold): void {
        this.thresholds.push(threshold);
    }

    /**
     * Update threshold
     */
    updateThreshold(metricName: string, updates: Partial<AlertThreshold>): void {
        const threshold = this.thresholds.find(t => t.metric === metricName);
        if (threshold) {
            Object.assign(threshold, updates);
        }
    }

    /**
     * Private methods
     */

    private setupMetricsCollection(): void {
        // Initialize metric collections
        this.metrics.set('eventProcessingTime', []);
        this.metrics.set('strategyEvaluationTime', []);
        this.metrics.set('memoryUsage', []);
        this.metrics.set('cpuUsage', []);
    }

    private resetMetrics(): void {
        this.metrics.clear();
        this.latencyBuckets = [];
        this.cacheMetrics = { hits: 0, misses: 0, responseTimes: [] };
        this.eventCounts = { total: 0, lastMinute: 0, minuteStart: Date.now() };
        this.setupMetricsCollection();
    }

    private addMetric(name: string, value: number): void {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        
        const values = this.metrics.get(name)!;
        values.push(value);
        
        // Keep only last 1000 values
        if (values.length > 1000) {
            this.metrics.set(name, values.slice(-1000));
        }
    }

    private collectSystemMetrics(): void {
        // Memory usage
        const memUsage = process.memoryUsage();
        this.addMetric('memoryUsage', memUsage.heapUsed / 1024 / 1024); // MB

        // CPU usage (simplified - in production, use proper CPU monitoring)
        const cpuUsage = process.cpuUsage();
        this.addMetric('cpuUsage', (cpuUsage.user + cpuUsage.system) / 1000000); // Convert to seconds
    }

    private calculateCurrentMetrics(): PerformanceMetrics {
        const now = new Date();
        const windowStart = new Date(now.getTime() - 60000); // Last minute

        // Calculate averages
        const eventProcessingTimes = this.metrics.get('eventProcessingTime') || [];
        const strategyEvaluationTimes = this.metrics.get('strategyEvaluationTime') || [];
        const memoryUsages = this.metrics.get('memoryUsage') || [];

        // Event processing metrics
        const eventsPerMinute = this.eventCounts.lastMinute * (60000 / (Date.now() - this.eventCounts.minuteStart));
        const avgProcessingTime = this.calculateAverage(eventProcessingTimes);

        // Strategy evaluation metrics
        const strategiesEvaluated = strategyEvaluationTimes.length;
        const avgEvaluationTime = this.calculateAverage(strategyEvaluationTimes);
        const sub30msEvaluations = strategyEvaluationTimes.filter(t => t < 30).length;
        const evaluationLatency95p = this.calculatePercentile(this.latencyBuckets, 95);
        const evaluationLatency99p = this.calculatePercentile(this.latencyBuckets, 99);

        // Cache metrics
        const totalCacheOps = this.cacheMetrics.hits + this.cacheMetrics.misses;
        const cacheHitRate = totalCacheOps > 0 ? this.cacheMetrics.hits / totalCacheOps : 0;
        const avgCacheResponseTime = this.calculateAverage(this.cacheMetrics.responseTimes);

        // System metrics
        const memoryUsage = this.calculateAverage(memoryUsages);
        const cpuUsages = this.metrics.get('cpuUsage') || [];
        const cpuUsage = this.calculateAverage(cpuUsages);

        return {
            eventsPerMinute: Math.round(eventsPerMinute),
            totalEventsProcessed: this.eventCounts.total,
            avgProcessingTime: Math.round(avgProcessingTime * 100) / 100,
            
            strategiesEvaluated,
            avgEvaluationTime: Math.round(avgEvaluationTime * 100) / 100,
            sub30msEvaluations,
            evaluationLatency95p: Math.round(evaluationLatency95p * 100) / 100,
            evaluationLatency99p: Math.round(evaluationLatency99p * 100) / 100,
            
            cacheHitRate: Math.round(cacheHitRate * 10000) / 100, // Percentage with 2 decimals
            cacheHits: this.cacheMetrics.hits,
            cacheMisses: this.cacheMetrics.misses,
            avgCacheResponseTime: Math.round(avgCacheResponseTime * 100) / 100,
            
            memoryUsage: Math.round(memoryUsage * 100) / 100,
            cpuUsage: Math.round(cpuUsage * 100) / 100,
            activeConnections: 0, // Would be implemented with actual connection tracking
            
            windowStart,
            windowEnd: now
        };
    }

    private calculateAverage(values: number[]): number {
        if (values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    private calculatePercentile(values: number[], percentile: number): number {
        if (values.length === 0) return 0;
        
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    private checkThresholds(metrics: PerformanceMetrics): void {
        for (const threshold of this.thresholds) {
            if (!threshold.enabled) continue;

            const metricValue = (metrics as any)[threshold.metric];
            if (metricValue === undefined) continue;

            let alertTriggered = false;

            switch (threshold.operator) {
                case 'greater_than':
                    alertTriggered = metricValue > threshold.value;
                    break;
                case 'less_than':
                    alertTriggered = metricValue < threshold.value;
                    break;
                case 'equals':
                    alertTriggered = Math.abs(metricValue - threshold.value) < 0.01;
                    break;
            }

            if (alertTriggered) {
                this.emit('alert', {
                    metric: threshold.metric,
                    value: metricValue,
                    threshold: threshold.value,
                    message: threshold.alertMessage,
                    timestamp: new Date()
                });
            }
        }
    }

    private async storeMetricsSnapshot(): Promise<void> {
        try {
            const metrics = this.calculateCurrentMetrics();
            const redisClient = getRedisClient();
            const key = `performance_metrics:${Date.now()}`;
            
            await redisClient.setEx(key, 86400 * 7, JSON.stringify(metrics)); // Store for 7 days
            
            console.log(`[PerformanceMonitor] Stored metrics snapshot: ${metrics.eventsPerMinute} events/min, ${metrics.avgEvaluationTime}ms avg eval time, ${metrics.cacheHitRate}% cache hit rate`);
            
        } catch (error) {
            console.error('[PerformanceMonitor] Error storing metrics snapshot:', error);
        }
    }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Wrapper functions for easy integration
 */

export function startPerformanceMonitoring(): void {
    performanceMonitor.startMonitoring();
    
    // Set up event listeners
    performanceMonitor.on('alert', (alert) => {
        console.warn(`[PERFORMANCE ALERT] ${alert.message}: ${alert.metric} = ${alert.value} (threshold: ${alert.threshold})`);
        // In production, this would send alerts to monitoring systems
    });

    performanceMonitor.on('metrics', (metrics: PerformanceMetrics) => {
        // Log key metrics every 10 seconds (can be reduced in production)
        if (metrics.eventsPerMinute > 0 || metrics.strategiesEvaluated > 0) {
            console.log(`[PerformanceMonitor] Events/min: ${metrics.eventsPerMinute}, Strategies evaluated: ${metrics.strategiesEvaluated}, Avg eval time: ${metrics.avgEvaluationTime}ms, Cache hit rate: ${metrics.cacheHitRate}%`);
        }
    });
}

export function recordEventProcessing(processingTimeMs: number): void {
    performanceMonitor.recordEventProcessed(processingTimeMs);
}

export function recordStrategyEvaluation(evaluationTimeMs: number): void {
    performanceMonitor.recordStrategyEvaluation(evaluationTimeMs);
}

export function recordCacheHit(responseTimeMs: number): void {
    performanceMonitor.recordCacheOperation(true, responseTimeMs);
}

export function recordCacheMiss(responseTimeMs: number): void {
    performanceMonitor.recordCacheOperation(false, responseTimeMs);
}

export function getCurrentPerformanceMetrics(): PerformanceMetrics {
    return performanceMonitor.getCurrentMetrics();
}

export async function getPerformanceHistory(hours: number = 24): Promise<PerformanceMetrics[]> {
    return await performanceMonitor.getPerformanceHistory(hours);
}
