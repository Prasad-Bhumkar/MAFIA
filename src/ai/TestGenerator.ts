import * as vscode from 'vscode';
import { AIServiceV2, AIRequest, Language } from './AIServiceV2';
import { ErrorHandler } from '../utils/ErrorHandler';

export class TestGenerator {
    constructor(private aiService: AIServiceV2) {}

    public async generateTestsForFile(uri: vscode.Uri): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            const language = this.mapLanguage(document.languageId);
            
            const request: AIRequest = {
                context: document.getText(),
                language: language,
                cursorPosition: new vscode.Position(0, 0),
                document: document
            };

            const response = await this.aiService.generateTests(request);
            if (!response.suggestions || response.suggestions.length === 0) {
                throw new Error('No test suggestions were generated');
            }
            await this.createTestFile(document, response.suggestions[0]);
            
            vscode.window.showInformationMessage('Tests generated successfully!');
        } catch (error) {
            ErrorHandler.handle(error, 'Test Generation');
        }
    }

    private async createTestFile(sourceDoc: vscode.TextDocument, testContent: string): Promise<void> {
        const testPath = this.getTestFilePath(sourceDoc.fileName);
        const uri = vscode.Uri.file(testPath);
        
        const edit = new vscode.WorkspaceEdit();
        edit.createFile(uri, { overwrite: true });
        edit.insert(uri, new vscode.Position(0, 0), testContent);
        
        await vscode.workspace.applyEdit(edit);
        await vscode.workspace.openTextDocument(uri).then(doc => {
            vscode.window.showTextDocument(doc);
        });
    }

    private getTestFilePath(sourcePath: string): string {
        // Implement logic to determine test file path based on project structure
        return sourcePath.replace('/src/', '/test/').replace('.ts', '.spec.ts');
    }

    private mapLanguage(languageId: string): Language {
        const mapping: Record<string, Language> = {
            'typescript': 'typescript',
            'javascript': 'typescript',
            'java': 'java',
            'python': 'python',
            'go': 'go',
            'rust': 'rust'
        };
        return mapping[languageId] || 'typescript';
    }
}