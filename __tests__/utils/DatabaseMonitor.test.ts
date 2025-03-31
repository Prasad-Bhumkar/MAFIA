import { DatabaseMonitor } from '../../src/utils/DatabaseMonitor';
import { DatabaseService } from '../../src/utils/DatabaseService';

describe('DatabaseMonitor', () => {
    beforeEach(() => {
        DatabaseMonitor.reset();
    });

    test('should track query metrics', async () => {
        const mockQuery = jest.fn().mockResolvedValue('result');
        await DatabaseMonitor.trackQuery(mockQuery, 'SELECT * FROM test');
        
        const metrics = DatabaseMonitor.getMetrics();
        expect(metrics.queryCount).toBe(1);
        expect(metrics.queryTimes.length).toBe(1);
    });

    test('should track slow queries', async () => {
        const slowQuery = () => new Promise(resolve => 
            setTimeout(() => resolve('slow'), 600));
        
        await DatabaseMonitor.trackQuery(slowQuery, 'SELECT * FROM large_table');
        
        const metrics = DatabaseMonitor.getMetrics();
        expect(metrics.slowQueries.length).toBe(1);
    });

    test('should track connection counts', async () => {
        const mockQuery = jest.fn()
            .mockImplementation(() => new Promise(resolve => 
                setTimeout(resolve, 100)));
        
        // Run multiple concurrent queries
        await Promise.all([
            DatabaseMonitor.trackQuery(mockQuery),
            DatabaseMonitor.trackQuery(mockQuery),
            DatabaseMonitor.trackQuery(mockQuery)
        ]);
        
        const metrics = DatabaseMonitor.getMetrics();
        expect(metrics.maxConnections).toBe(3);
    });

    test('should handle query errors', async () => {
        const failingQuery = jest.fn().mockRejectedValue(new Error('DB error'));
        
        await expect(DatabaseMonitor.trackQuery(failingQuery))
            .rejects.toThrow('DB error');
        
        const metrics = DatabaseMonitor.getMetrics();
        expect(metrics.errorCount).toBe(1);
    });
});