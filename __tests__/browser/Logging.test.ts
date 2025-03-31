import { BrowserService } from '../../src/ai/BrowserService';
import * as puppeteer from 'puppeteer';

describe('BrowserService Logging', () => {
    let browserService: BrowserService;

    beforeEach(() => {
        browserService = BrowserService.getInstance();
        jest.clearAllMocks();
    });

    it('should capture console logs', async () => {
        await browserService.launchBrowser();
        
        // Simulate console messages
        const mockPage = {
            on: jest.fn((event, callback) => {
                if (event === 'console') {
                    callback({
                        type: jest.fn().mockReturnValue('log'),
                        text: jest.fn().mockReturnValue('Test message'),
                        location: jest.fn().mockReturnValue({})
                    });
                }
            })
        };
        require('puppeteer').Browser.prototype.newPage.mockResolvedValue(mockPage);

        expect(browserService.getConsoleLogs()).toContain('Test message');
    });

    it('should filter log types', async () => {
        await browserService.launchBrowser();
        
        // Simulate different log types
        browserService['logs'] = [
            { type: 'log', text: 'Info message', location: {}, timestamp: '2023-01-01' },
            { type: 'warning', text: 'Warning message', location: {}, timestamp: '2023-01-01' },
            { type: 'error', text: 'Error message', location: {}, timestamp: '2023-01-01' }
        ];

        const allLogs = browserService.getConsoleLogs();
        expect(allLogs).toContain('Info message');
        expect(allLogs).toContain('Warning message');
        expect(allLogs).toContain('Error message');
    });

    it('should clear logs', async () => {
        await browserService.launchBrowser();
        
        // Add some logs
        browserService['logs'] = [
            { type: 'log', text: 'Test message', location: {}, timestamp: '2023-01-01' }
        ];

        browserService.clearConsoleLogs();
        expect(browserService.getConsoleLogs()).toBe('');
    });

    it('should persist logs across sessions', async () => {
        // Mock file system operations
        const mockLogs = [{ type: 'log', text: 'Persisted log', location: {}, timestamp: '2023-01-01' }];
        require('vscode').workspace.fs.writeFile = jest.fn();
        require('vscode').workspace.fs.readFile = jest.fn().mockResolvedValue(Buffer.from(JSON.stringify(mockLogs)));

        // Test saving logs
        await browserService.launchBrowser();
        browserService['logs'] = mockLogs;
        await browserService.closeBrowser();
        expect(require('vscode').workspace.fs.writeFile).toHaveBeenCalled();

        // Test loading logs
        await browserService.launchBrowser();
        expect(browserService.getConsoleLogs()).toContain('Persisted log');
    });
});