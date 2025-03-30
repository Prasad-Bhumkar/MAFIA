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
exports.FileParserUtils = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
const ErrorHandler_1 = require("./ErrorHandler");
class FileParserUtils {
    constructor() { }
    async parseDocument(document) {
        try {
            const content = document.getText();
            const languageId = document.languageId;
            // Basic structure analysis
            let structure = '';
            if (['javascript', 'typescript'].includes(languageId)) {
                structure = this.parseJavaScriptStructure(content);
            }
            else if (languageId === 'java') {
                structure = this.parseJavaStructure(content);
            }
            else if (languageId === 'python') {
                structure = this.parsePythonStructure(content);
            }
            return `File: ${document.fileName}\n` +
                `Language: ${languageId}\n` +
                `Structure:\n${structure}`;
        }
        catch (error) {
            ErrorHandler_1.ErrorHandler.handle(error, 'Document Parsing');
            throw error;
        }
    }
    parseJavaScriptStructure(content) {
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
    parseJavaStructure(content) {
        // Extract classes, methods and fields
        const classRegex = /(?:class|interface)\s+(\w+)/g;
        const methodRegex = /(?:public|private|protected)\s+(?:\w+\s+)*(\w+)\s*\(/g;
        return this.extractStructureElements(content, [
            { regex: classRegex, type: 'Class' },
            { regex: methodRegex, type: 'Method' }
        ]);
    }
    parsePythonStructure(content) {
        // Extract classes and functions
        const classRegex = /class\s+(\w+)/g;
        const functionRegex = /def\s+(\w+)/g;
        return this.extractStructureElements(content, [
            { regex: classRegex, type: 'Class' },
            { regex: functionRegex, type: 'Function' }
        ]);
    }
    extractStructureElements(content, matchers) {
        let result = '';
        for (const matcher of matchers) {
            let match;
            while ((match = matcher.regex.exec(content)) !== null) {
                result += `- ${matcher.type}: ${match[1]}\n`;
            }
        }
        return result || 'No detectable structure elements found';
    }
    static getBasicClassInfo(content, filePath) {
        const packageMatch = content.match(/package\s+([\w.]+);/);
        const classMatch = content.match(/class\s+(\w+)/);
        return {
            package: packageMatch?.[1] || '',
            className: classMatch?.[1] || path.basename(filePath, '.java'),
            filePath
        };
    }
    static parseAnnotations(content) {
        const matches = content.match(/@(\w+)/g) || [];
        return [...new Set(matches.map(m => m.substring(1)))];
    }
    static findDependencies(content) {
        const dependencies = [];
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
    static parseMethods(content) {
        const methods = [];
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
    static async getFileHash(filePath) {
        const content = await fs.promises.readFile(filePath);
        return crypto.createHash('sha256').update(content).digest('hex');
    }
}
exports.FileParserUtils = FileParserUtils;
//# sourceMappingURL=FileParserUtils.js.map