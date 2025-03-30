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
exports.TestGenerator = void 0;
const vscode = __importStar(require("vscode"));
const ErrorHandler_1 = require("../utils/ErrorHandler");
class TestGenerator {
    constructor(aiService) {
        this.aiService = aiService;
    }
    async generateTestsForFile(uri) {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            const language = this.mapLanguage(document.languageId);
            const request = {
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
        }
        catch (error) {
            ErrorHandler_1.ErrorHandler.handle(error, 'Test Generation');
        }
    }
    async createTestFile(sourceDoc, testContent) {
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
    getTestFilePath(sourcePath) {
        // Implement logic to determine test file path based on project structure
        return sourcePath.replace('/src/', '/test/').replace('.ts', '.spec.ts');
    }
    mapLanguage(languageId) {
        const mapping = {
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
exports.TestGenerator = TestGenerator;
//# sourceMappingURL=TestGenerator.js.map