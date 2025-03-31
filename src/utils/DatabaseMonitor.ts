import { DatabaseService } from './DatabaseService';
import { DatabaseErrorHandler } from './DatabaseErrorHandler';
import { EnvironmentConfig } from './EnvironmentConfig';
import { Logger } from './Logger';

export class DatabaseMonitor {
    private static metrics = {
        queryCount: 0,
        errorCount: 0,
        queryTimes: [] as number[],
        lastError: null as Error | null,
        lastErrorTime: null as number | null,
        slowQueries: [] as {query: string, duration: number}[],
        activeConnections: 0,
        maxConnections: 0
    };

    private static slowQueryThreshold = parseInt(
        EnvironmentConfig.get('SLOW_QUERY_THRESHOLD_MS') || '500'
    );
    private static alertThreshold = parseInt(
        EnvironmentConfig.get('ALERT_THRESHOLD') || '10'
    );

    public static async trackQuery<T>(fn: () => Promise<T>, query?: string): Promise<T> {
        const start = Date.now();
        this.metrics.queryCount++;
        this.metrics.activeConnections++;
        this.metrics.maxConnections = Math.max(
            this.metrics.maxConnections, 
            this.metrics.activeConnections
        );

        try {
            const result = await fn();
            const duration = Date.now() - start;
            this.metrics.queryTimes.push(duration);

            // Track slow queries
            if (duration > this.slowQueryThreshold && query) {
                this.metrics.slowQueries.push({
                    query: query.length > 100 ? query.substring(0, 100) + '...' : query,
                    duration
                });
                Logger.warn(`Slow query detected (${duration}ms): ${query}`);
            }

            return result;
        } catch (error) {
            this.metrics.errorCount++;
            this.metrics.lastError = error as Error;
            this.metrics.lastErrorTime = Date.now();

            // Check for alert threshold
            if (this.metrics.errorCount >= this.alertThreshold) {
                Logger.error(`Error threshold reached: ${this.metrics.errorCount} errors in last minute`);
            }

            await DatabaseErrorHandler.handle(error, 'DatabaseMonitor');
            throw error;
        } finally {
            this.metrics.activeConnections--;
        }
    }

    public static getMetrics() {
        const avgQueryTime = this.metrics.queryTimes.length > 0
            ? this.metrics.queryTimes.reduce((a, b) => a + b, 0) / this.metrics.queryTimes.length
            : 0;

        return {
            ...this.metrics,
            avgQueryTime,
            minQueryTime: Math.min(...this.metrics.queryTimes),
            maxQueryTime: Math.max(...this.metrics.queryTimes),
            queryTimePercentiles: this.calculatePercentiles(),
            slowQueryThreshold: this.slowQueryThreshold,
            alertThreshold: this.alertThreshold
        };
    }

    private static calculatePercentiles() {
        if (this.metrics.queryTimes.length === 0) return {};

        const sorted = [...this.metrics.queryTimes].sort((a, b) => a - b);
        return {
            p50: sorted[Math.floor(sorted.length * 0.5)],
            p90: sorted[Math.floor(sorted.length * 0.9)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)]
        };
    }

    public static reset() {
        this.metrics = {
            queryCount: 0,
            errorCount: 0,
            queryTimes: [],
            lastError: null,
            lastErrorTime: null,
            slowQueries: [],
            activeConnections: this.metrics.activeConnections,
            maxConnections: this.metrics.maxConnections
        };
    }

    public static async logToDatabase() {
        const metrics = this.getMetrics();
        try {
            await DatabaseService.getInstance().then(async (dbService) => {
                await dbService.logError(
                    'DatabaseMetrics',
                    new Error(JSON.stringify(metrics))
                );
            });
        } catch (error) {
            Logger.error('Failed to log metrics to database', error);
        }
    }
}