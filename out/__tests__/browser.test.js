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
const browser_1 = require("../src/browser");
const puppeteer = __importStar(require("puppeteer"));
describe('Browser Automation Module', () => {
    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => { });
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    test('should initialize browser automation', async () => {
        await (0, browser_1.setupBrowserAutomation)();
        expect(console.log).toHaveBeenCalledWith('Browser automation module initialized');
    });
    test('should create isolated browser instance', async () => {
        const browser = await (0, browser_1.createIsolatedBrowser)('test-user');
        expect(browser).toBeInstanceOf(puppeteer.Browser);
        expect(typeof browser.newPage).toBe('function');
        const page = await browser.newPage();
        await page.goto('https://example.com');
        expect(await page.title()).toBe('Example Domain');
        await browser.close();
    });
});
//# sourceMappingURL=browser.test.js.map