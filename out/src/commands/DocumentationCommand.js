"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentationCommand = void 0;
const vscode = __importStar(require("vscode"));
const AIServiceV2_1 = require("../ai/AIServiceV2");
class DocumentationCommand {
    constructor(context) {
        this.context = context;
    }
    register() {
        return vscode.commands.registerCommand('mafia.generateDocumentation', () => this.execute());
    }
    async execute() {
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
                const docContents = await Promise.all(files.map(async (file) => {
                    const document = await vscode.workspace.openTextDocument(file);
                    const request = {
                        context: document.getText(),
                        language: 'typescript',
                        cursorPosition: new vscode.Position(0, 0),
                        document
                    };
                    const response = await AIServiceV2_1.AIServiceV2.getInstance(this.context).explainCode(request);
                    return `# ${file.path}\n\n${response.suggestions.join('\n')}\n\n`;
                }));
                const docContent = docContents.join('\n---\n\n');
                // Ensure docs directory exists
                const docsUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'docs');
                try {
                    await vscode.workspace.fs.stat(docsUri);
                }
                catch {
                    await vscode.workspace.fs.createDirectory(docsUri);
                }
                // Save documentation
                const outputUri = vscode.Uri.joinPath(docsUri, 'generated.md');
                await vscode.workspace.fs.writeFile(outputUri, Buffer.from(docContent));
                progress.report({ increment: 100 });
                vscode.window.showInformationMessage(`Documentation generated at ${outputUri.path}`);
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to generate documentation: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.DocumentationCommand = DocumentationCommand;
//# sourceMappingURL=DocumentationCommand.js.map