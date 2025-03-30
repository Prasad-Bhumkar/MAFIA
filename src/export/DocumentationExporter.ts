import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ErrorHandler } from '../utils/ErrorHandler';

export class DocumentationExporter {
    public async exportToFile(content: string, defaultFileName: string): Promise<vscode.Uri | undefined> {
        try {
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(path.join(vscode.workspace.rootPath || '', defaultFileName)),
                filters: {
                    'Markdown Files': ['md'],
                    'Text Files': ['txt'],
                    'All Files': ['*']
                },
                saveLabel: 'Export Documentation'
            });

            if (uri) {
                await fs.promises.writeFile(uri.fsPath, content);
                vscode.window.showInformationMessage(`Documentation exported to ${path.basename(uri.fsPath)}`);
                return uri;
            }
            return undefined;
        } catch (error) {
            ErrorHandler.handle(error, 'Documentation Export');
            throw error;
        }
    }

    public async exportToClipboard(content: string): Promise<void> {
        try {
            await vscode.env.clipboard.writeText(content);
            vscode.window.showInformationMessage('Documentation copied to clipboard');
        } catch (error) {
            ErrorHandler.handle(error, 'Clipboard Export');
            throw error;
        }
    }
}