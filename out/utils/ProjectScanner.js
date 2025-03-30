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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectScanner = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
class ProjectScanner {
    scanProject(workspaceFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            const structure = {
                controllers: [],
                services: [],
                repositories: [],
                models: [],
                configs: []
            };
            for (const [type, pattern] of Object.entries(ProjectScanner.PATTERNS)) {
                const files = yield vscode.workspace.findFiles(new vscode.RelativePattern(workspaceFolder, pattern), '**/node_modules/**');
                structure[type] = files.map(uri => ({
                    path: uri.fsPath,
                    name: path.basename(uri.fsPath)
                }));
            }
            return structure;
        });
    }
    analyzeClass(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = yield fs.promises.readFile(filePath, 'utf8');
            const packageMatch = content.match(/package\s+([\w.]+)/);
            const classMatch = content.match(/class\s+(\w+)/);
            return {
                package: (packageMatch === null || packageMatch === void 0 ? void 0 : packageMatch[1]) || '',
                className: (classMatch === null || classMatch === void 0 ? void 0 : classMatch[1]) || path.basename(filePath, '.java'),
                filePath,
                annotations: [...new Set(content.match(/@\w+/g) || [])],
                isRestController: content.includes('@RestController'),
                dependencies: this.extractDependencies(content),
                methods: this.extractMethods(content)
            };
        });
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
    getFileHash(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = yield fs.promises.readFile(filePath, 'utf8');
            return crypto.createHash('md5').update(content).digest('hex');
        });
    }
    analyzeFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const classDetails = yield this.analyzeClass(filePath);
            return {
                filePath,
                components: [classDetails],
                relationships: this.extractDependencies(yield fs.promises.readFile(filePath, 'utf8')),
                metrics: {
                    complexity: classDetails.methods.length,
                    annotations: classDetails.annotations.length
                }
            };
        });
    }
    analyzeFolder(folderPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const javaFiles = (yield vscode.workspace.findFiles(new vscode.RelativePattern(folderPath, '**/*.java'), '**/node_modules/**')).map(uri => uri.fsPath);
            const files = yield Promise.all(javaFiles.map(file => this.analyzeFile(file)));
            return {
                folderPath,
                files: javaFiles,
                summary: {
                    totalFiles: files.length,
                    totalMethods: files.reduce((sum, f) => sum + f.metrics.complexity, 0),
                    totalDependencies: files.reduce((sum, f) => sum + f.relationships.length, 0)
                }
            };
        });
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