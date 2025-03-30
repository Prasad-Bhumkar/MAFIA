import { setupBrowserAutomation, createIsolatedBrowser } from '../src/browser';
import * as puppeteer from 'puppeteer';

describe('Browser Automation Module', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should initialize browser automation', async () => {
    await setupBrowserAutomation();
    expect(console.log).toHaveBeenCalledWith('Browser automation module initialized');
  });

  test('should create isolated browser instance', async () => {
    const browser = await createIsolatedBrowser('test-user');
    expect(browser).toBeInstanceOf(puppeteer.Browser);
    expect(typeof browser.newPage).toBe('function');
    
    const page = await browser.newPage();
    await page.goto('https://example.com');
    expect(await page.title()).toBe('Example Domain');
    
    await browser.close();
  });
});