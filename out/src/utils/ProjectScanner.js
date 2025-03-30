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
exports.ProjectScanner = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
class ProjectScanner {
    async scanProject(workspaceFolder) {
        const structure = {
            controllers: [],
            services: [],
            repositories: [],
            models: [],
            configs: []
        };
        for (const [type, pattern] of Object.entries(ProjectScanner.PATTERNS)) {
            const files = await vscode.workspace.findFiles(new vscode.RelativePattern(workspaceFolder, pattern), '**/node_modules/**');
            structure[type] = files.map(uri => ({
                path: uri.fsPath,
                name: path.basename(uri.fsPath)
            }));
        }
        return structure;
    }
    async analyzeClass(filePath) {
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
    extractDependencies(content) {
        return (content.match(/@Autowired\s+(?:@Qualifier\("[^"]+"\)\s+)?(\w+)\s+(\w+)/g) || [])
            .map(match => {
            const [, type, field] = match.match(/@Autowired\s+(?:@Qualifier\("[^"]+"\)\s+)?(\w+)\s+(\w+)/) || [];
            return { field: field || '', type: type || '' };
        });
    }
    extractMethods(content) {
        return (content.match(/(?:public|private|protected)\s+\w+\s+\w+\([^)]*\)\s*\{/g) || [])
            .map(method => {
            const name = method.split(/\s+/)[2].split('(')[0];
            return {
                name,
                annotations: method.match(/@\w+/g) || []
            };
        });
    }
    async getFileHash(filePath) {
        const content = await fs.promises.readFile(filePath, 'utf8');
        return crypto.createHash('md5').update(content).digest('hex');
    }
    async analyzeFile(filePath) {
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
    async analyzeFolder(folderPath) {
        const javaFiles = (await vscode.workspace.findFiles(new vscode.RelativePattern(folderPath, '**/*.java'), '**/node_modules/**')).map(uri => uri.fsPath);
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
exports.ProjectScanner = ProjectScanner;
ProjectScanner.PATTERNS = {
    controllers: '**/*Controller.java',
    services: '**/*Service.java',
    repositories: '**/*Repository.java',
    models: '**/*.java',
    configs: '**/application*.properties'
};
//# sourceMappingURL=ProjectScanner.js.map