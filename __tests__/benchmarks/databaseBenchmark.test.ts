import { DatabaseService } from '../../src/utils/DatabaseService';
import { performance } from 'perf_hooks';

describe('Database Performance Benchmarks', () => {
  const iterations = 100;
  let dbService: DatabaseService;

  beforeAll(async () => {
    dbService = await DatabaseService.getInstance();
  });

  afterAll(async () => {
    await dbService.close();
  });

  test('Error logging performance', async () => {
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      try {
        throw new Error(`Test error ${i}`);
      } catch (error) {
        await dbService.logError('Benchmark context', error as Error);
      }
    }

    const duration = performance.now() - start;
    console.log(`Average error logging time: ${(duration/iterations).toFixed(2)}ms`);
  });

  test('Query performance', async () => {
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      await dbService.getUserSettings(`test-user-${i}`);
    }

    const duration = performance.now() - start;
    console.log(`Average query time: ${(duration/iterations).toFixed(2)}ms`);
  });
});