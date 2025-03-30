import * as vscode from 'vscode';

export interface JavaClassDetails {
    package: string;
    className: string;
    filePath: string;
    annotations: string[];
    isRestController: boolean;
    dependencies: { field: string; type: string }[];
    methods: { name: string; annotations: string[] }[];
}

export interface ProjectStructure {
    controllers: { path: string; name: string }[];
    services: { path: string; name: string }[];
    repositories: { path: string; name: string }[];
    models: { path: string; name: string }[];
    configs: { path: string; name: string }[];
}

export interface FileDetectorInterface {
    detectProjectStructure(workspaceFolder: vscode.WorkspaceFolder): Promise<ProjectStructure>;
    getJavaClassDetails(filePath: string): Promise<JavaClassDetails>;
    getFileHash(filePath: string): Promise<string>;
}