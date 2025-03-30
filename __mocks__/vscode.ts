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