import { DatabaseService } from '../../src/utils/DatabaseService';
import { DatabaseErrorHandler } from '../../src/utils/DatabaseErrorHandler';
import * as path from 'path';
import * as fs from 'fs';

describe('DatabaseService', () => {
    const testDbPath = path.join(__dirname, '../../mafia-test.db');
    let dbService: DatabaseService;

    beforeAll(async () => {
        // Create test database
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
        fs.writeFileSync(testDbPath, '');
        
        // Initialize service with test database
        dbService = await DatabaseService.getInstance();
    });

    afterAll(async () => {
        await dbService.close();
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    it('should log errors correctly', async () => {
        const testError = new Error('Test error');
        await dbService.logError('Test context', testError);
    });

    it('should manage user settings', async () => {
        const userId = 'test-user';
        const settings = {
            apiKey: 'test-api-key',
            themePreference: 'light',
            enableAnalytics: false
        };

        // Test create
        await dbService.updateUserSettings(userId, settings);
        const savedSettings = await dbService.getUserSettings(userId);
        expect(savedSettings.api_key).toBe(settings.apiKey);

        // Test update
        const updatedSettings = {...settings, themePreference: 'dark'};
        await dbService.updateUserSettings(userId, updatedSettings);
        const updated = await dbService.getUserSettings(userId);
        expect(updated.theme_preference).toBe('dark');
    });

    it('should manage dependencies', async () => {
        const testProject = '/test/project';
        await dbService.updateDependency('test-package', '1.0.0', testProject, 'safe');
        const deps = await dbService.getDependencies(testProject);
        expect(deps.length).toBe(1);
        expect(deps[0].vulnerability_status).toBe('safe');
    });

    it('should manage test cases', async () => {
        const testProject = '/test/project';
        await dbService.saveTestCase('test-case', 'test code', testProject);
        const tests = await dbService.getTestCases(testProject);
        expect(tests.length).toBe(1);

        await dbService.updateTestResult('test-case', testProject, 'passed', 100);
        const updated = await dbService.getTestCases(testProject);
        expect(updated[0].status).toBe('passed');
    });
});