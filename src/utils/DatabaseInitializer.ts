import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import * as path from 'path';
import { EnvironmentConfig } from './EnvironmentConfig';

export class DatabaseInitializer {
    private static pool: any[] = [];
    private static maxPoolSize = 5;
    private static isProduction = false;

    public static async initialize(): Promise<any> {
        this.isProduction = EnvironmentConfig.get('NODE_ENV') === 'production';
        const dbPath = this.getDatabasePath();
        const poolSize = this.getPoolSize();

        // Initialize connection pool
        if (this.isProduction) {
            for (let i = 0; i < poolSize; i++) {
                const db = await this.createDatabaseConnection(dbPath);
                this.pool.push(db);
            }
        }

        return {
            getConnection: async () => {
                if (this.isProduction && this.pool.length > 0) {
                    return this.pool.pop();
                }
                return await this.createDatabaseConnection(dbPath);
            },
            releaseConnection: (conn: any) => {
                if (this.isProduction && this.pool.length < this.maxPoolSize) {
                    this.pool.push(conn);
                } else {
                    conn.close();
                }
            }
        };
    }

    private static async createDatabaseConnection(dbPath: string) {
        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
            mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE | sqlite3.OPEN_FULLMUTEX
        });

        // Enable WAL mode for better concurrency in production
        if (this.isProduction) {
            await db.exec('PRAGMA journal_mode=WAL;');
            await db.exec('PRAGMA synchronous=NORMAL;');
        }

        return db;
    }

    private static getDatabasePath(): string {
        return EnvironmentConfig.get('DATABASE_PATH') || 
               path.join(__dirname, '../../mafia.db');
    }

    private static getPoolSize(): number {
        const defaultSize = this.isProduction ? 5 : 1;
        return parseInt(EnvironmentConfig.get('DB_POOL_SIZE') || defaultSize.toString());
    }

    public static async runMigrations() {
        const db = await this.createDatabaseConnection(this.getDatabasePath());
        try {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS QueryMetrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    query_text TEXT,
                    execution_time INTEGER,
                    parameters TEXT,
                    success BOOLEAN,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS Alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT,
                    message TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    resolved BOOLEAN DEFAULT FALSE,
                    query_metric_id INTEGER REFERENCES QueryMetrics(id)
                );

                CREATE TABLE IF NOT EXISTS Deployments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    commit_hash TEXT,
                    version TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    status TEXT,
                    environment TEXT
                );
            `);
        } finally {
            db.close();
        }
    }
}