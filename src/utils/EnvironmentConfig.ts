import * as dotenv from 'dotenv';
import * as path from 'path';

export class EnvironmentConfig {
    private static initialized = false;

    public static initialize() {
        if (this.initialized) return;

        const envPath = path.join(__dirname, '../../.env');
        dotenv.config({ path: envPath });
        this.initialized = true;
    }

    public static get(key: string): string | undefined {
        if (!this.initialized) this.initialize();
        return process.env[key];
    }

    public static getRequired(key: string): string {
        const value = this.get(key);
        if (!value) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
        return value;
    }
}