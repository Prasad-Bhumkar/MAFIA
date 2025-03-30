import fs from 'fs-extra';
import * as path from 'path';

const blockedExtensions = ['.exe', '.dll', '.bat', '.sh'];

export async function setupFileOperations(): Promise<void> {
    console.log('File operations module initialized');
}

export async function safeWriteFile(filePath: string, content: string): Promise<void> {
    const ext = path.extname(filePath).toLowerCase();
    if (blockedExtensions.includes(ext)) {
        throw new Error(`Blocked file extension: ${ext}`);
    }
    await fs.outputFile(filePath, content);
}

export async function safeReadFile(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    if (blockedExtensions.includes(ext)) {
        throw new Error(`Blocked file extension: ${ext}`);
    }
    return await fs.readFile(filePath, 'utf-8');
}

export async function listSafeFiles(dirPath: string): Promise<string[]> {
    const files = await fs.readdir(dirPath);
    return files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return !blockedExtensions.includes(ext);
    });
}

export async function logTask(taskId: string, message: string): Promise<void> {
    const logDir = './logs';
    const logPath = path.join(logDir, `${taskId}.log`);
    
    try {
        await fs.ensureDir(logDir);
        await fs.appendFile(logPath, `${new Date().toISOString()} - ${message}\n`);
    } catch (error) {
        console.error('Error logging task:', error);
        throw error;
    }
}
