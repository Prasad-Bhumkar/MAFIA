import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

import * as vscode from 'vscode';
import { ErrorHandler } from './ErrorHandler';

export class FileParserUtils {
    public constructor() {}

    public async parseDocument(document: vscode.TextDocument): Promise<string> {
        try {
            const content = document.getText();
            const languageId = document.languageId;
            
            // Basic structure analysis
            let structure = '';
            if (['javascript', 'typescript'].includes(languageId)) {
                structure = this.parseJavaScriptStructure(content);
            } else if (languageId === 'java') {
                structure = this.parseJavaStructure(content);
            } else if (languageId === 'python') {
                structure = this.parsePythonStructure(content);
            }

            return `File: ${document.fileName}\n` +
                   `Language: ${languageId}\n` +
                   `Structure:\n${structure}`;
        } catch (error) {
            ErrorHandler.handle(error, 'Document Parsing');
            throw error;
        }
    }

    private parseJavaScriptStructure(content: string): string {
        // Extract classes, functions and exports
        const classRegex = /(?:class|interface)\s+(\w+)/g;
        const functionRegex = /function\s+(\w+)/g;
        const exportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
        
        return this.extractStructureElements(content, [
            { regex: classRegex, type: 'Class' },
            { regex: functionRegex, type: 'Function' },
            { regex: exportRegex, type: 'Export' }
        ]);
    }

    private parseJavaStructure(content: string): string {
        // Extract classes, methods and fields
        const classRegex = /(?:class|interface)\s+(\w+)/g;
        const methodRegex = /(?:public|private|protected)\s+(?:\w+\s+)*(\w+)\s*\(/g;
        
        return this.extractStructureElements(content, [
            { regex: classRegex, type: 'Class' },
            { regex: methodRegex, type: 'Method' }
        ]);
    }

    private parsePythonStructure(content: string): string {
        // Extract classes and functions
        const classRegex = /class\s+(\w+)/g;
        const functionRegex = /def\s+(\w+)/g;
        
        return this.extractStructureElements(content, [
            { regex: classRegex, type: 'Class' },
            { regex: functionRegex, type: 'Function' }
        ]);
    }

    private extractStructureElements(content: string, matchers: {regex: RegExp, type: string}[]): string {
        let result = '';
        for (const matcher of matchers) {
            let match;
            while ((match = matcher.regex.exec(content)) !== null) {
                result += `- ${matcher.type}: ${match[1]}\n`;
            }
        }
        return result || 'No detectable structure elements found';
    }

    static getBasicClassInfo(content: string, filePath: string):
        { package: string; className: string; filePath: string } {
        const packageMatch = content.match(/package\s+([\w.]+);/);
        const classMatch = content.match(/class\s+(\w+)/);
        
        return {
            package: packageMatch?.[1] || '',
            className: classMatch?.[1] || path.basename(filePath, '.java'),
            filePath
        };
    }

    static parseAnnotations(content: string): string[] {
        const matches = content.match(/@(\w+)/g) || [];
        return [...new Set(matches.map(m => m.substring(1)))];
    }

    static findDependencies(content: string): { field: string; type: string }[] {
        const dependencies: { field: string; type: string }[] = [];
        const regex = /@(?:Autowired|Inject)[^;]+?(\w+)\s+(\w+)\s*;/g;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            dependencies.push({
                type: match[1],
                field: match[2]
            });
        }
        return dependencies;
    }

    static parseMethods(content: string): { name: string; annotations: string[] }[] {
        const methods: { name: string; annotations: string[] }[] = [];
        const regex = /(@\w+.*?)?\s*(?:public|private|protected)?\s*(?:\w+\s+)?(\w+)\s*\([^)]*\)/g;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            const annotations = match[1] ? 
                [...match[1].matchAll(/@(\w+)/g)].map(m => m[1]) : [];
            methods.push({
                name: match[2],
                annotations
            });
        }
        return methods;
    }

    static async getFileHash(filePath: string): Promise<string> {
        const content = await fs.promises.readFile(filePath);
        return crypto.createHash('sha256').update(content).digest('hex');
    }
}