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
exports.setupBrowserAutomation = setupBrowserAutomation;
exports.createIsolatedBrowser = createIsolatedBrowser;
exports.autoFillForms = autoFillForms;
exports.safeScreenshot = safeScreenshot;
exports.terminateBrowser = terminateBrowser;
const puppeteer = __importStar(require("puppeteer"));
async function setupBrowserAutomation() {
    console.log('Browser automation module initialized');
}
async function createIsolatedBrowser(userId) {
    return await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            `--user-data-dir=./mafia-profile-${userId}`
        ]
    });
}
async function autoFillForms(page) {
    await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea');
        inputs.forEach((input, i) => {
            input.value = `Test Input ${i + 1}`;
        });
    });
}
async function safeScreenshot(page, path) {
    if (!path.toLowerCase().endsWith('.png')) {
        throw new Error('Screenshots must be saved as PNG files');
    }
    await page.screenshot({ path });
}
async function terminateBrowser(browser) {
    try {
        await browser.close();
    }
    catch (error) {
        console.error('Error terminating browser:', error);
        throw error;
    }
}
//# sourceMappingURL=browser.js.map