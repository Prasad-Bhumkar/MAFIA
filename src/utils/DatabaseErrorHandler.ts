import * as vscode from 'vscode';
import { DatabaseService } from './DatabaseService';

export class DatabaseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DatabaseError';
    }
}

export class DatabaseConnectionError extends DatabaseError {
    constructor(message: string) {
        super(`Connection failed: ${message}`);
        this.name = 'DatabaseConnectionError';
    }
}

export class DatabaseQueryError extends DatabaseError {
    constructor(message: string) {
        super(`Query failed: ${message}`);
        this.name = 'DatabaseQueryError';
    }
}

export class DatabaseErrorHandler {
    public static async handle(error: unknown, context: string): Promise<void> {
        try {
            const dbService = await DatabaseService.getInstance();
            const errorObj = error instanceof Error ? error : new Error(String(error));
            await dbService.logError(context, errorObj);
            
            vscode.window.showErrorMessage(`${context}: ${errorObj.message}`);
            console.error(`[${context}]`, errorObj);
        } catch (dbError) {
            console.error('Failed to log error to database:', dbError);
            vscode.window.showErrorMessage(`Critical error: Failed to log error (${context})`);
        }
    }
}