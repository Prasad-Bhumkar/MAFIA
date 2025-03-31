import { jest } from '@jest/globals';

const vscode = {
    window: {
        showInputBox: jest.fn(() => Promise.resolve('test-api-key')),
        showErrorMessage: jest.fn(),
        showWarningMessage: jest.fn(),
        createOutputChannel: jest.fn().mockReturnValue({
            appendLine: jest.fn(),
            show: jest.fn()
        })
    },
    workspace: {
        getConfiguration: jest.fn().mockReturnValue({
            get: jest.fn(),
            update: jest.fn()
        }),
        fs: {
            writeFile: jest.fn().mockImplementation(() => Promise.resolve()),
            readFile: jest.fn().mockImplementation((uri: unknown) => {
                const path = typeof uri === 'object' && uri !== null && 'fsPath' in uri 
                    ? (uri as { fsPath: string }).fsPath
                    : '';
                if (path.includes('browser_logs.json')) {
                    return Promise.resolve(Buffer.from('[]'));
                }
                const error = new Error('File not found');
                (error as any).code = 'ENOENT';
                return Promise.reject(error);
            }),
            createDirectory: jest.fn().mockImplementation(() => Promise.resolve()),
        },
        workspaceFolders: [{
            uri: {
                fsPath: '/project/sandbox/user-workspace/MAFIA'
            }
        }]
    },
    Uri: {
        file: jest.fn().mockImplementation(path => ({ fsPath: path })),
        joinPath: jest.fn().mockImplementation((...args: unknown[]) => {
            const [base, ...paths] = args;
            return {
                fsPath: [
                    typeof base === 'object' && base !== null && 'fsPath' in base 
                        ? (base as { fsPath: string }).fsPath 
                        : String(base),
                    ...paths.map(String)
                ].join('/')
            };
        })
    },
    ExtensionContext: jest.fn(),
    SecretStorage: jest.fn().mockImplementation(() => ({
        get: jest.fn(),
        store: jest.fn(),
        delete: jest.fn(),
        onDidChange: jest.fn()
    }))
};

module.exports = vscode;