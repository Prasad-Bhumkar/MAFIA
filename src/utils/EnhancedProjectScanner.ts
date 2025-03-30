import { ProjectScanner } from './ProjectScanner';
import * as vscode from 'vscode';
import { JavaClassDetails } from './FileDetectorTypes';

export class EnhancedProjectScanner extends ProjectScanner {
    async getContextForPosition(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<string> {
        const filePath = document.uri.fsPath;
        const classDetails = await this.analyzeClass(filePath);
        const surroundingCode = this.getSurroundingCode(document, position);
        
        return `
        // Class Context
        Package: ${classDetails.package}
        Class: ${classDetails.className}
        Annotations: ${classDetails.annotations.join(', ')}
        Methods: ${classDetails.methods.map(m => m.name).join(', ')}
        
        // Code Context
        ${surroundingCode}
        `;
    }

    private getSurroundingCode(
        document: vscode.TextDocument,
        position: vscode.Position
    ): string {
        const range = new vscode.Range(
            new vscode.Position(Math.max(0, position.line - 5), 0),
            new vscode.Position(Math.min(position.line + 5, document.lineCount), 0)
        );
        return document.getText(range);
    }
}