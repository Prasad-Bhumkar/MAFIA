import * as vscode from 'vscode';
import * as puppeteer from 'puppeteer';
import { Logger } from '../utils/Logger';
import { DatabaseService } from '../utils/DatabaseService';

export interface BrowserSession {
    id: string;
    url: string;
    timestamp: number;
    screenshot?: string;
    title?: string;
    status?: number;
}

export class BrowserService {
    private static instance: BrowserService;
    private browser: puppeteer.Browser | null = null;
    private activePage: puppeteer.Page | null = null;
    private context: vscode.ExtensionContext;
    private sessions: BrowserSession[] = [];

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public static getInstance(context: vscode.ExtensionContext): BrowserService {
        if (!BrowserService.instance) {
            BrowserService.instance = new BrowserService(context);
        }
        return BrowserService.instance;
    }

    public async launch(): Promise<void> {
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
            await dbService.query(
                'INSERT INTO browser_sessions (id, data) VALUES (?, ?)',
                [session.id, JSON.stringify(session)]
            );
        } catch (error) {
            Logger.error('Failed to save browser session', error);
        }

        Logger.info(`Navigated to ${url}`);
        return session;
    }

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

    public getSessionHistory(): BrowserSession[] {
        return [...this.sessions];
    }

    public async getCurrentPageContent(): Promise<string> {
        if (!this.activePage) {
            throw new Error('No active page');
        }
        return this.activePage.content();
    }
}