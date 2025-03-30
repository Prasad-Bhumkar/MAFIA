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
exports.DependencyMapper = void 0;
const vscode = __importStar(require("vscode"));
const ProjectScanner_1 = require("../utils/ProjectScanner");
const AIServiceV2_1 = require("../ai/AIServiceV2");
class DependencyMapper {
    constructor(context) {
        this.scanner = new ProjectScanner_1.ProjectScanner();
        this.aiService = AIServiceV2_1.AIServiceV2.getInstance(context);
    }
    async analyzeDependencies(uri) {
        const projectStructure = await this.scanner.analyzeFolder(uri.fsPath);
        const request = {
            context: JSON.stringify(projectStructure),
            language: 'java',
            cursorPosition: new vscode.Position(0, 0),
            document: await vscode.workspace.openTextDocument(uri),
            prompt: 'Analyze and map dependencies for this project structure:'
        };
        const response = await this.aiService.getEnhancedSuggestions(request);
        return this.parseDependencyMap(response.suggestions[0]);
    }
    parseDependencyMap(aiResponse) {
        try {
            return JSON.parse(aiResponse);
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to parse dependency map');
            return {};
        }
    }
}
exports.DependencyMapper = DependencyMapper;
//# sourceMappingURL=DependencyMapper.js.map