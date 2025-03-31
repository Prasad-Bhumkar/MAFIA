import { BrowserService } from '../../src/ai/BrowserService';
import vscode from 'vscode';

describe('Log Persistence', () => {
    let browserService: BrowserService;

    beforeAll(() => {
        browserService = BrowserService.getInstance();
        // Clear all mock implementations before each test
        jest.clearAllMocks();
    });

    it('should save logs to file', async () => {
        // Mock log entries
        browserService['logs'] = [
            { type: 'log', text: 'test', location: {}, timestamp: new Date().toISOString() }
        ];

        await browserService['saveLogsToFile']();
        
        // Verify vscode.workspace.fs.writeFile was called
        expect(vscode.workspace.fs.writeFile).toHaveBeenCalled();
        
        // Verify vscode.workspace.fs.writeFile was called
        expect(vscode.workspace.fs.writeFile).toHaveBeenCalled();
        
        // Get the actual arguments used
        const [uri, data] = (vscode.workspace.fs.writeFile as jest.Mock).mock.calls[0];
        
        // Verify the data contains our test log
        expect(JSON.parse(data.toString())).toEqual(
            expect.arrayContaining([
                expect.objectContaining({text: 'test'})
            ])
        );
    });

    it('should load logs from file', async () => {
        // Setup mock return value for readFile
        const testLogs = [{ 
            type: 'log', 
            text: 'loaded', 
            location: {}, 
            timestamp: new Date().toISOString() 
        }];
        (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValueOnce(
            Buffer.from(JSON.stringify(testLogs))
        );

        await browserService['loadLogsFromFile']();
        expect(browserService.getConsoleLogs()).toContain('loaded');
    });

    it('should handle missing log file', async () => {
        // Clear existing logs first
        browserService['logs'] = [];
        
        // Mock file not found error with ENOENT code
        const notFoundError = new Error('File not found');
        (notFoundError as any).code = 'ENOENT';
        (vscode.workspace.fs.readFile as jest.Mock).mockRejectedValueOnce(notFoundError);

        await browserService['loadLogsFromFile']();
        // Verify logs array remains empty
        expect(browserService['logs']).toEqual([]);
    });
});
