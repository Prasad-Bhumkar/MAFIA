import { EnvironmentConfig } from './EnvironmentConfig';
import { DatabaseService } from './DatabaseService';

export class Logger {
    private static logLevel = EnvironmentConfig.get('LOG_LEVEL') || 'info';

    public static debug(message: string, context?: any) {
        if (this.shouldLog('debug')) {
            console.debug(`[DEBUG] ${message}`, context);
            this.logToDatabase('debug', message, context);
        }
    }

    public static info(message: string, context?: any) {
        if (this.shouldLog('info')) {
            console.info(`[INFO] ${message}`, context);
            this.logToDatabase('info', message, context);
        }
    }

    public static warn(message: string, context?: any) {
        if (this.shouldLog('warn')) {
            console.warn(`[WARN] ${message}`, context);
            this.logToDatabase('warn', message, context);
        }
    }

    public static error(message: string, error?: unknown, context?: any) {
        if (this.shouldLog('error')) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error(`[ERROR] ${message}`, err, context);
            this.logToDatabase('error', message, { error: err, ...context });
        }
    }

    private static shouldLog(level: string): boolean {
        const levels = ['error', 'warn', 'info', 'debug'];
        return levels.indexOf(level) <= levels.indexOf(this.logLevel);
    }

    private static async logToDatabase(level: string, message: string, context: any = {}) {
        try {
            const dbService = await DatabaseService.getInstance();
            await dbService.logError(
                `Logger.${level}`,
                new Error(message),
                JSON.stringify(context)
            );
        } catch (error) {
            console.error('Failed to log to database', error);
        }
    }
}