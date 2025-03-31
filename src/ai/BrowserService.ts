/**
 * MAFIA Browser Service - Web Automation Engine
 * 
 * REPLICATION GUIDE: How to replicate BLACKBOXAI's browser capabilities
 * 
 * 1. Core Capabilities:
 * - Headless/headed browser automation via Puppeteer
 * - Page navigation and DOM interaction
 * - Screenshot capture and session history
 * - Safe script execution sandbox
 * - Session persistence and logging
 * 
 * 2. Implementation Requirements:
 * - Puppeteer package (@types/puppeteer)
 * - DatabaseService for session logging
 * - Logger for error tracking
 * - VSCode extension context
 * 
 * 3. Key Patterns:
 * - Singleton instance pattern
 * - Async/await for all operations
 * - Centralized error handling
 * - Session persistence
 * - Lazy initialization
 * 
 * 4. Configuration:
 * - Set headless: false for debugging
 * - Adjust timeouts as needed (default 60s)
 * - Add --no-sandbox args for container compatibility
 * 
 * 5. Integration Points:
 * - BrowserCommands.ts (command registration)
 * - DatabaseService.ts (session logging)
 * - Logger.ts (error tracking)
 * - ExtensionMain.ts (lifecycle management)
 * 
 * 6. Setup Steps:
 * 1) Install Puppeteer: npm install puppeteer
 * 2) Implement DatabaseService for logging
 * 3) Create BrowserCommands for VSCode integration
 * 4) Register service in extension activation
 * 5) Add cleanup in extension deactivation
 * 
 * 7. Key Files to Replicate:
 * - BrowserService.ts (this file)
 * - BrowserCommands.ts
 * - DatabaseService.ts
 * - Logger.ts
 */

import * as vscode from 'vscode';
import * as puppeteer from 'puppeteer';
import { Logger } from '../utils/Logger';
import { DatabaseService } from '../utils/DatabaseService';

/**
 * Browser session interface representing a navigation event
 */
export interface BrowserSession {
    id: string;
    url: string;
    timestamp: number;
    screenshot?: string;
    title?: string;
    status?: number;
}

export class BrowserService {
    /**
     * Singleton instance
     */
    private static instance: BrowserService;
    
    /**
     * Puppeteer browser instance
     */
    private browser: puppeteer.Browser | null = null;
    
    /**
     * Currently active page
     */
    private activePage: puppeteer.Page | null = null;
    
    /**
     * VSCode extension context
     */
    private context: vscode.ExtensionContext;
    
    /**
     * Session history
     */
    private sessions: BrowserSession[] = [];

    /**
     * Private constructor for singleton pattern
     * @param context VSCode extension context
     */
    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * Get singleton instance
     * @param context VSCode extension context
     * @returns BrowserService instance
     */
    public static getInstance(context: vscode.ExtensionContext): BrowserService {
        if (!BrowserService.instance) {
            BrowserService.instance = new BrowserService(context);
        }
        return BrowserService.instance;
    }

    /**
     * REPLICATION GUIDE: Browser Launch
     * 
     * 1. Functionality:
     * - Initializes Puppeteer browser instance
     * - Configures default viewport and sandbox
     * - Handles both headless and headed modes
     * 
     * 2. Implementation Notes:
     * - Uses singleton pattern
     * - No-op if browser already running
     * - Sandbox disabled for container compatibility
     * 
     * 3. Usage Example:
     * await browserService.launch();
     * 
     * @throws Error if browser fails to launch
     */
    public async launchBrowser(): Promise<void> {
        try {
            if (this.browser) {
                Logger.info('Browser already running');
                return;
            }

            this.browser = await puppeteer.launch({
                headless: false,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                defaultViewport: null
            });

            Logger.info('Browser launched successfully');
        } catch (error) {
            Logger.error('Failed to launch browser', error);
            throw error;
        }
    }

    /**
     * REPLICATION GUIDE: Page Navigation
     * 
     * 1. Functionality:
     * - Creates new browser tab/page
     * - Navigates to specified URL
     * - Waits for network idle
     * - Logs session to database
     * 
     * 2. Implementation Notes:
     * - Auto-launches browser if not running
     * - 60s timeout for slow pages
     * - Captures page title and status
     * 
     * 3. Usage Example:
     * const session = await browserService.navigate('https://example.com');
     * 
     * @param url URL to navigate to
     * @returns BrowserSession object with navigation details
     * @throws Error if navigation fails
     */
    public async navigate(url: string): Promise<BrowserSession> {
        if (!this.browser) {
            await this.launch();
        }

        this.activePage = await this.browser!.newPage();
        const response = await this.activePage.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 60000 
        });

        // Create session object
        const session: BrowserSession = {
            id: Date.now().toString(),
            url,
            timestamp: Date.now(),
            title: await this.activePage.title(),
            status: response?.status()
        };
        this.sessions.push(session);

        try {
            // Save to database
            const dbService = await DatabaseService.getInstance();
            await dbService.logAction(
                'BROWSER_SESSION', 
                JSON.stringify(session)
            );
        } catch (error) {
            Logger.error('Failed to save browser session', error);
        }

        Logger.info(`Navigated to ${url}`);
        return session;
    }

    /**
     * REPLICATION GUIDE: Screenshot Capture
     * 
     * 1. Functionality:
     * - Captures full page screenshot
     * - Returns base64 encoded image
     * - Updates last session with screenshot
     * 
     * 2. Implementation Notes:
     * - Full page capture (scrolls automatically)
     * - Base64 format for easy storage
     * - Requires active page session
     * 
     * 3. Usage Example:
     * const screenshot = await browserService.captureScreenshot();
     * 
     * @returns Base64-encoded screenshot
     * @throws Error if no active page or capture fails
     */
    public async captureScreenshot(): Promise<string> {
        try {
            if (!this.activePage) {
                throw new Error('No active page to capture');
            }

            const screenshot = await this.activePage.screenshot({ 
                encoding: 'base64',
                fullPage: true 
            }) as string;

            // Update last session with screenshot
            if (this.sessions.length > 0) {
                this.sessions[this.sessions.length - 1].screenshot = screenshot;
            }

            Logger.info('Screenshot captured successfully');
            return screenshot;
        } catch (error) {
            Logger.error('Failed to capture screenshot', error);
            throw error;
        }
    }

    /**
     * REPLICATION GUIDE: Script Execution
     * 
     * 1. Functionality:
     * - Executes JS in browser context
     * - Returns evaluation result
     * - Handles errors gracefully
     * 
     * 2. Implementation Notes:
     * - Sandboxed execution environment
     * - Access to page DOM and APIs
     * - Async scripts supported
     * 
     * 3. Usage Example:
     * const result = await browserService.executeScript(
     *   'document.title = "New Title"; return document.title;'
     * );
     * 
     * @param script JavaScript to execute
     * @returns Script execution result
     * @throws Error if no active page or script fails
     */
    public async executeScript(script: string): Promise<any> {
        try {
            if (!this.activePage) {
                throw new Error('No active page to execute script');
            }

            const result = await this.activePage.evaluate(script);
            Logger.info('Script executed successfully');
            return result;
        } catch (error) {
            Logger.error('Failed to execute script', error);
            throw error;
        }
    }

    /**
     * Close browser instance and cleanup
     * @throws Error if browser fails to close
     */
    public async close(): Promise<void> {
        try {
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
                this.activePage = null;
                Logger.info('Browser closed successfully');
            }
        } catch (error) {
            Logger.error('Failed to close browser', error);
            throw error;
        }
    }

    /**
     * Get copy of session history
     * @returns Array of BrowserSession objects
     */
    public getSessionHistory(): BrowserSession[] {
        return [...this.sessions];
    }

    /**
     * Get HTML content of current page
     * @returns Page HTML content
     * @throws Error if no active page
     */
    public async getCurrentPageContent(): Promise<string> {
        if (!this.activePage) {
            throw new Error('No active page');
        }
        return this.activePage.content();
    }
}