import * as sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { Logger } from './Logger';

interface AIRequestLog {
    prompt: string;
    language: string;
    context: string;
    timestamp: Date;
}

interface TestResult {
    testName: string;
    passed: boolean;
    errorMessage?: string;
}

interface Dependency {
    sourceFile: string;
    dependentFile: string;
    dependencyType: string;
}

export class DatabaseService {
    private static instance: DatabaseService;
    private db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

    private constructor() {}

    public static async getInstance(): Promise<DatabaseService> {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
            await DatabaseService.instance.initialize();
        }
        return DatabaseService.instance;
    }

    private async initialize(): Promise<void> {
        try {
            this.db = await open({
                filename: './mafia.db',
                driver: sqlite3.Database
            });

            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS logs (
                    id INTEGER PRIMARY KEY,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    action_type TEXT NOT NULL,
                    details TEXT
                );
                
                CREATE TABLE IF NOT EXISTS dependencies (
                    id INTEGER PRIMARY KEY,
                    source_file TEXT NOT NULL,
                    dependent_file TEXT NOT NULL,
                    dependency_type TEXT CHECK(dependency_type IN ('IMPORT', 'INCLUDE'))
                );
                
                CREATE TABLE IF NOT EXISTS coverage (
                    id INTEGER PRIMARY KEY,
                    file_path TEXT NOT NULL,
                    line_coverage REAL,
                    branch_coverage REAL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS test_results (
                    id INTEGER PRIMARY KEY,
                    test_name TEXT NOT NULL,
                    passed BOOLEAN,
                    error_message TEXT,
                    coverage_id INTEGER,
                    FOREIGN KEY (coverage_id) REFERENCES coverage(id)
                );
            `);
        } catch (error) {
            Logger.error('Failed to initialize database', error);
            throw error;
        }
    }

    public async logAction(action: string, details: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        try {
            await this.db.run(
                'INSERT INTO logs (action_type, details) VALUES (?, ?)',
                [action, details]
            );
        } catch (error) {
            Logger.error('Failed to log action', error);
            throw error;
        }
    }

    public async getCoverage(filePath: string): Promise<{ lineCoverage: number, branchCoverage: number }> {
        if (!this.db) throw new Error('Database not initialized');
        try {
            const result = await this.db.get<{line_coverage: number, branch_coverage: number}>(
                'SELECT line_coverage, branch_coverage FROM coverage WHERE file_path = ? ORDER BY timestamp DESC LIMIT 1',
                [filePath]
            );
            return {
                lineCoverage: result?.line_coverage || 0,
                branchCoverage: result?.branch_coverage || 0
            };
        } catch (error) {
            Logger.error('Failed to get coverage', error);
            throw error;
        }
    }

    public async getTestResults(filePath: string): Promise<TestResult[]> {
        if (!this.db) throw new Error('Database not initialized');
        try {
            const results = await this.db.all<TestResult[]>(
                `SELECT t.test_name as testName, t.passed, t.error_message as errorMessage 
                 FROM test_results t
                 JOIN coverage c ON t.coverage_id = c.id
                 WHERE c.file_path = ?`,
                [filePath]
            );
            return results || [];
        } catch (error) {
            Logger.error('Failed to get test results', error);
            throw error;
        }
    }

    public async getDependencies(filePath: string): Promise<Dependency[]> {
        if (!this.db) throw new Error('Database not initialized');
        try {
            const results = await this.db.all<Dependency[]>(
                `SELECT source_file as sourceFile, dependent_file as dependentFile, dependency_type as dependencyType
                 FROM dependencies
                 WHERE source_file = ? OR dependent_file = ?`,
                [filePath, filePath]
            );
            return results || [];
        } catch (error) {
            Logger.error('Failed to get dependencies', error);
            throw error;
        }
    }

    public async logRequest(request: AIRequestLog): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        try {
            await this.db.run(
                `INSERT INTO logs (action_type, details) 
                 VALUES (?, ?)`,
                ['AI_REQUEST', JSON.stringify(request)]
            );
        } catch (error) {
            Logger.error('Failed to log AI request', error);
            throw error;
        }
    }

    public async close(): Promise<void> {
        try {
            if (this.db) {
                await this.db.close();
            }
        } catch (error) {
            Logger.error('Failed to close database', error);
            throw error;
        }
    }
}