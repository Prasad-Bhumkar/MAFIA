import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { DatabaseInitializer } from './DatabaseInitializer';
import { DatabaseErrorHandler } from './DatabaseErrorHandler';
import * as path from 'path';

export class DatabaseService {
    private static instance: DatabaseService;
    private db: any;

    private constructor() {}

    public static async getInstance(): Promise<DatabaseService> {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
            await DatabaseService.instance.initialize();
        }
        return DatabaseService.instance;
    }

    private async initialize() {
        try {
            this.db = await DatabaseInitializer.initialize();
        } catch (error) {
            await DatabaseErrorHandler.handle(error, 'Database Service Initialization');
            throw error;
        }
    }

    // Error Logging
    public async logError(context: string, error: Error, additionalData: string = ''): Promise<void> {
        try {
            await this.db.run(
                'INSERT INTO ErrorLogs (context, error_message, stack_trace, additional_data, timestamp) VALUES (?, ?, ?, ?, ?)',
                [context, error.message, error.stack, additionalData, new Date().toISOString()]
            );
        } catch (dbError) {
            await DatabaseErrorHandler.handle(dbError, 'Error Logging');
        }
    }

    // User Settings
    public async getUserSettings(userId: string): Promise<any> {
        try {
            return await this.db.get(
                'SELECT * FROM UserSettings WHERE user_id = ?',
                [userId]
            );
        } catch (error) {
            await DatabaseErrorHandler.handle(error, 'Get User Settings');
            throw error;
        }
    }

    public async updateUserSettings(userId: string, settings: any): Promise<void> {
        try {
            const existing = await this.getUserSettings(userId);
            if (existing) {
                await this.db.run(
                    `UPDATE UserSettings 
                    SET api_key = ?, theme_preference = ?, enable_analytics = ?
                    WHERE user_id = ?`,
                    [settings.apiKey, settings.themePreference, settings.enableAnalytics, userId]
                );
            } else {
                await this.db.run(
                    `INSERT INTO UserSettings 
                    (user_id, api_key, theme_preference, enable_analytics)
                    VALUES (?, ?, ?, ?)`,
                    [userId, settings.apiKey, settings.themePreference, settings.enableAnalytics]
                );
            }
        } catch (error) {
            await DatabaseErrorHandler.handle(error, 'Update User Settings');
            throw error;
        }
    }

    // Dependency Management
    public async updateDependency(
        packageName: string,
        version: string,
        projectPath: string,
        status: string = 'unknown'
    ): Promise<void> {
        try {
            await this.db.run(
                `INSERT OR REPLACE INTO Dependencies 
                (package_name, version, vulnerability_status, project_path)
                VALUES (?, ?, ?, ?)`,
                [packageName, version, status, projectPath]
            );
        } catch (error) {
            await DatabaseErrorHandler.handle(error, 'Update Dependency');
            throw error;
        }
    }

    public async getDependencies(projectPath: string): Promise<any[]> {
        try {
            return await this.db.all(
                'SELECT * FROM Dependencies WHERE project_path = ?',
                [projectPath]
            );
        } catch (error) {
            await DatabaseErrorHandler.handle(error, 'Get Dependencies');
            throw error;
        }
    }

    // Test Case Management
    public async saveTestCase(
        testName: string,
        testCode: string,
        projectPath: string
    ): Promise<void> {
        try {
            await this.db.run(
                `INSERT OR REPLACE INTO TestCases 
                (test_name, test_code, project_path)
                VALUES (?, ?, ?)`,
                [testName, testCode, projectPath]
            );
        } catch (error) {
            await DatabaseErrorHandler.handle(error, 'Save Test Case');
            throw error;
        }
    }

    public async getTestCases(projectPath: string): Promise<any[]> {
        try {
            return await this.db.all(
                'SELECT * FROM TestCases WHERE project_path = ?',
                [projectPath]
            );
        } catch (error) {
            await DatabaseErrorHandler.handle(error, 'Get Test Cases');
            throw error;
        }
    }

    public async updateTestResult(
        testName: string,
        projectPath: string,
        status: string,
        executionTime?: number
    ): Promise<void> {
        try {
            await this.db.run(
                `UPDATE TestCases 
                SET status = ?, last_run = CURRENT_TIMESTAMP, execution_time = ?
                WHERE test_name = ? AND project_path = ?`,
                [status, executionTime, testName, projectPath]
            );
        } catch (error) {
            await DatabaseErrorHandler.handle(error, 'Update Test Result');
            throw error;
        }
    }

    // Utility Methods
    public async close(): Promise<void> {
        try {
            await this.db.close();
        } catch (error) {
            await DatabaseErrorHandler.handle(error, 'Database Close');
            throw error;
        }
    }
}