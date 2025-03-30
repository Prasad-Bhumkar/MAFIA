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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupFileOperations = setupFileOperations;
exports.safeWriteFile = safeWriteFile;
exports.safeReadFile = safeReadFile;
exports.listSafeFiles = listSafeFiles;
exports.logTask = logTask;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path = __importStar(require("path"));
const blockedExtensions = ['.exe', '.dll', '.bat', '.sh'];
async function setupFileOperations() {
    console.log('File operations module initialized');
}
async function safeWriteFile(filePath, content) {
    const ext = path.extname(filePath).toLowerCase();
    if (blockedExtensions.includes(ext)) {
        throw new Error(`Blocked file extension: ${ext}`);
    }
    await fs_extra_1.default.outputFile(filePath, content);
}
async function safeReadFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (blockedExtensions.includes(ext)) {
        throw new Error(`Blocked file extension: ${ext}`);
    }
    return await fs_extra_1.default.readFile(filePath, 'utf-8');
}
async function listSafeFiles(dirPath) {
    const files = await fs_extra_1.default.readdir(dirPath);
    return files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return !blockedExtensions.includes(ext);
    });
}
async function logTask(taskId, message) {
    const logDir = './logs';
    const logPath = path.join(logDir, `${taskId}.log`);
    try {
        await fs_extra_1.default.ensureDir(logDir);
        await fs_extra_1.default.appendFile(logPath, `${new Date().toISOString()} - ${message}\n`);
    }
    catch (error) {
        console.error('Error logging task:', error);
        throw error;
    }
}
//# sourceMappingURL=fs.js.map