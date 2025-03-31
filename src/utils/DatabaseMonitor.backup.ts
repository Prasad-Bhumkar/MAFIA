import { DatabaseService } from './DatabaseService';
import { DatabaseErrorHandler } from './DatabaseErrorHandler';

export class DatabaseMonitor {
  private static metrics = {
    queryCount: 0,
    errorCount: 0,
    queryTimes: [] as number[],
    lastError: null as Error|null,
    lastErrorTime: null as number|null
  };

  public static async trackQuery<T>(fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    this.metrics.queryCount++;
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.metrics.queryTimes.push(duration);
      return result;
    } catch (error) {
      this.metrics.errorCount++;
      this.metrics.lastError = error as Error;
      this.metrics.lastErrorTime = Date.now();
      await DatabaseErrorHandler.handle(error, 'DatabaseMonitor');
      throw error;
    }
  }

  public static getMetrics() {
    const avgQueryTime = this.metrics.queryTimes.length > 0 
      ? this.metrics.queryTimes.reduce((a,b) => a + b, 0) / this.metrics.queryTimes.length
      : 0;

    return {
      ...this.metrics,
      avgQueryTime,
      minQueryTime: Math.min(...this.metrics.queryTimes),
      maxQueryTime: Math.max(...this.metrics.queryTimes),
      queryTimePercentiles: this.calculatePercentiles()
    };
  }

  private static calculatePercentiles() {
    if (this.metrics.queryTimes.length === 0) return {};
    
    const sorted = [...this.metrics.queryTimes].sort((a,b) => a - b);
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
      lastErrorTime: null
    };
  }
}