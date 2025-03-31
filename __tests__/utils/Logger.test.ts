import { Logger } from '../../src/utils/Logger';
import { DatabaseService } from '../../src/utils/DatabaseService';

describe('Logger', () => {
    beforeEach(() => {
        jest.spyOn(console, 'debug').mockImplementation(() => {});
        jest.spyOn(console, 'info').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should log debug messages when level is debug', () => {
        Logger.debug('Test debug message', { key: 'value' });
        expect(console.debug).toHaveBeenCalled();
    });

    test('should handle non-Error objects in error logging', () => {
        Logger.error('Test error', 'Not an error object', { key: 'value' });
        expect(console.error).toHaveBeenCalled();
    });

    test('should log to database with additional context', async () => {
        const mockLogError = jest.spyOn(DatabaseService.prototype, 'logError')
            .mockImplementation(async () => {});
        
        await Logger.info('Test info with context', { key: 'value' });
        
        expect(mockLogError).toHaveBeenCalledWith(
            'Logger.info',
            expect.any(Error),
            expect.stringContaining('"key":"value"')
        );
    });
});