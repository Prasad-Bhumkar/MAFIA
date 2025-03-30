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
exports.FileParserUtils = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
class FileParserUtils {
    static getBasicClassInfo(content, filePath) {
        const packageMatch = content.match(/package\s+([\w.]+);/);
        const classMatch = content.match(/class\s+(\w+)/);
        return {
            package: (packageMatch === null || packageMatch === void 0 ? void 0 : packageMatch[1]) || '',
            className: (classMatch === null || classMatch === void 0 ? void 0 : classMatch[1]) || path.basename(filePath, '.java'),
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
    static getFileHash(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = yield fs.promises.readFile(filePath);
            return crypto.createHash('sha256').update(content).digest('hex');
        });
    }
}
exports.FileParserUtils = FileParserUtils;
//# sourceMappingURL=FileParserUtils.js.map