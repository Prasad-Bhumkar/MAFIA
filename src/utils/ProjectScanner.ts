import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { JavaClassDetails, ProjectStructure } from './FileDetectorTypes';

export class ProjectScanner {
    private static PATTERNS = {
        controllers: '**/*Controller.java',
        services: '**/*Service.java', 
        repositories: '**/*Repository.java',
        models: '**/*.java',
        configs: '**/application*.properties'
    };

    async scanProject(workspaceFolder: vscode.WorkspaceFolder): Promise<ProjectStructure> {
        const structure: ProjectStructure = {
            controllers: [],
            services: [],
            repositories: [],
            models: [],
            configs: []
        };

        for (const [type, pattern] of Object.entries(ProjectScanner.PATTERNS)) {
            const files = await vscode.workspace.findFiles(
                new vscode.RelativePattern(workspaceFolder, pattern),
                '**/node_modules/**'
            );
            
            structure[type as keyof ProjectStructure] = files.map(uri => ({
                path: uri.fsPath,
                name: path.basename(uri.fsPath)
            }));
        }

        return structure;
    }

    async analyzeClass(filePath: string): Promise<JavaClassDetails> {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const packageMatch = content.match(/package\s+([\w.]+)/);
        const classMatch = content.match(/class\s+(\w+)/);

        return {
            package: packageMatch?.[1] || '',
            className: classMatch?.[1] || path.basename(filePath, '.java'),
            filePath,
            annotations: [...new Set(content.match(/@\w+/g) || [])],
            isRestController: content.includes('@RestController'),
            dependencies: this.extractDependencies(content),
            methods: this.extractMethods(content)
        };
    }

    private extractDependencies(content: string): Array<{field: string, type: string}> {
        return (content.match(/@Autowired\s+(?:@Qualifier\("[^"]+"\)\s+)?(\w+)\s+(\w+)/g) || [])
            .map(match => {
                const [, type, field] = match.match(/@Autowired\s+(?:@Qualifier\("[^"]+"\)\s+)?(\w+)\s+(\w+)/) || [];
                return { field: field || '', type: type || '' };
            });
    }

    private extractMethods(content: string): Array<{name: string, annotations: string[]}> {
        return (content.match(/(?:public|private|protected)\s+\w+\s+\w+\([^)]*\)\s*\{/g) || [])
            .map(method => {
                const name = method.split(/\s+/)[2].split('(')[0];
                return {
                    name,
                    annotations: method.match(/@\w+/g) || []
                };
            });
    }

    async getFileHash(filePath: string): Promise<string> {
        const content = await fs.promises.readFile(filePath, 'utf8');
        return crypto.createHash('md5').update(content).digest('hex');
    }

    async analyzeFile(filePath: string): Promise<FileAnalysisResult> {
        const classDetails = await this.analyzeClass(filePath);
        return {
            filePath,
            components: [classDetails],
            relationships: this.extractDependencies(await fs.promises.readFile(filePath, 'utf8')),
            metrics: {
                complexity: classDetails.methods.length,
                annotations: classDetails.annotations.length
            }
        };
    }

    async analyzeFolder(folderPath: string): Promise<FolderAnalysisResult> {
        const javaFiles = (await vscode.workspace.findFiles(
            new vscode.RelativePattern(folderPath, '**/*.java'),
            '**/node_modules/**'
        )).map(uri => uri.fsPath);

        const files = await Promise.all(javaFiles.map(file => this.analyzeFile(file)));
        
        return {
            folderPath,
            files: javaFiles,
            summary: {
                totalFiles: files.length,
                totalMethods: files.reduce((sum, f) => sum + f.metrics.complexity, 0),
                totalDependencies: files.reduce((sum, f) => sum + f.relationships.length, 0)
            }
        };
    }
}

interface FileAnalysisResult {
    filePath: string;
    components: JavaClassDetails[];
    relationships: Array<{field: string, type: string}>;
    metrics: {
        complexity: number;
        annotations: number;
    };
}

interface FolderAnalysisResult {
    folderPath: string;
    files: string[];
    summary: {
        totalFiles: number;
        totalMethods: number;
        totalDependencies: number;
    };
}
