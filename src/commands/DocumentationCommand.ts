import * as vscode from 'vscode';
import { AIRequest, AIServiceV2 } from '../ai/AIServiceV2';

export class DocumentationCommand {
    constructor(private context: vscode.ExtensionContext) {}

    public register() {
        return vscode.commands.registerCommand('mafia.generateDocumentation', () => this.execute());
    }

    private async execute() {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating documentation..."
            }, async (progress) => {
                progress.report({ increment: 0 });

                // Get all source files
                const files = await vscode.workspace.findFiles('**/*.{ts,js}', '**/node_modules/**');
                if (files.length === 0) {
                    throw new Error('No source files found');
                }

                if (!vscode.workspace.workspaceFolders) {
                    throw new Error('No workspace folder open');
                }

                // Generate documentation content for each file
                const docContents = await Promise.all(files.map(async file => {
                    const document = await vscode.workspace.openTextDocument(file);
                    const request: AIRequest = {
                        context: document.getText(),
                        language: 'typescript' as const,
                        cursorPosition: new vscode.Position(0, 0),
                        document
                    };
                    const response = await AIServiceV2.getInstance(this.context).explainCode(request);
                    return `# ${file.path}\n\n${response.suggestions.join('\n')}\n\n`;
                }));
                
                const docContent = docContents.join('\n---\n\n');
                
                // Ensure docs directory exists
                const docsUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'docs');
                try {
                    await vscode.workspace.fs.stat(docsUri);
                } catch {
                    await vscode.workspace.fs.createDirectory(docsUri);
                }

                // Save documentation
                const outputUri = vscode.Uri.joinPath(docsUri, 'generated.md');
                await vscode.workspace.fs.writeFile(outputUri, Buffer.from(docContent));

                progress.report({ increment: 100 });
                vscode.window.showInformationMessage(`Documentation generated at ${outputUri.path}`);
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate documentation: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
