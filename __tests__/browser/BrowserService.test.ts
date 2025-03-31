import * as vscode from 'vscode';
import { BrowserService } from '../../src/ai/BrowserService';
import { ErrorHandler } from '../../src/utils/ErrorHandler';

jest.mock('puppeteer');
jest.mock('../../src/utils/ErrorHandler');

describe('BrowserService', () => {
    let browserService: BrowserService;

    beforeEach(() => {
        browserService = BrowserService.getInstance();
        jest.clearAllMocks();
    });

    describe('launchBrowser', () => {
        it('should launch browser successfully', async () => {
            await expect(browserService.launchBrowser()).resolves.not.toThrow();
        });

        it('should handle launch errors', async () => {
            const mockError = new Error('Launch failed');
            require('puppeteer').launch.mockRejectedValue(mockError);
            
            await expect(browserService.launchBrowser()).rejects.toThrow('Failed to launch browser');
            expect(ErrorHandler.handle).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Launch failed' }),
                'Browser Launch'
            );
        });
    });

    describe('navigateTo', () => {
        it('should navigate to URL successfully', async () => {
            await browserService.launchBrowser();
            await expect(browserService.navigateTo('https://example.com')).resolves.not.toThrow();
        });

        it('should throw if browser not initialized', async () => {
            await expect(browserService.navigateTo('https://example.com')).rejects.toThrow(
                'Browser not initialized'
            );
        });
    });

    describe('takeScreenshot', () => {
        it('should take screenshot successfully', async () => {
            await browserService.launchBrowser();
            const screenshot = await browserService.takeScreenshot();
            expect(typeof screenshot).toBe('string');
        });

        it('should throw if browser not initialized', async () => {
            await expect(browserService.takeScreenshot()).rejects.toThrow(
                'Browser not initialized'
            );
        });
    });

    describe('closeBrowser', () => {
        it('should close browser successfully', async () => {
            await browserService.launchBrowser();
            await expect(browserService.closeBrowser()).resolves.not.toThrow();
        });

        it('should handle close errors', async () => {
            const mockError = new Error('Close failed');
            require('puppeteer').Browser.prototype.close.mockRejectedValue(mockError);
            await browserService.launchBrowser();
            
            await expect(browserService.closeBrowser()).rejects.toThrow('Failed to close browser');
        });
    });

    describe('executeBrowserAction', () => {
        it('should execute click action by selector', async () => {
            await browserService.launchBrowser();
            await expect(browserService.executeBrowserAction('click', { selector: '#test' }))
                .resolves.not.toThrow();
        });

        it('should execute click action by coordinates', async () => {
            await browserService.launchBrowser();
            await expect(browserService.executeBrowserAction('click', { x: 100, y: 100 }))
                .resolves.not.toThrow();
        });

        it('should execute type action', async () => {
            await browserService.launchBrowser();
            await expect(browserService.executeBrowserAction('type', { 
                selector: '#input', 
                text: 'test' 
            })).resolves.not.toThrow();
        });

        it('should execute scroll action', async () => {
            await browserService.launchBrowser();
            await expect(browserService.executeBrowserAction('scroll', {}))
                .resolves.not.toThrow();
        });
    });
});