import * as puppeteer from 'puppeteer';

export async function setupBrowserAutomation(): Promise<void> {
    console.log('Browser automation module initialized');
}

export async function createIsolatedBrowser(userId: string): Promise<puppeteer.Browser> {
    return await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            `--user-data-dir=./mafia-profile-${userId}`
        ]
    });
}

export async function autoFillForms(page: puppeteer.Page): Promise<void> {
    await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea');
        inputs.forEach((input, i) => {
            (input as HTMLInputElement).value = `Test Input ${i + 1}`;
        });
    });
}

export async function safeScreenshot(page: puppeteer.Page, path: string): Promise<void> {
    if (!path.toLowerCase().endsWith('.png')) {
        throw new Error('Screenshots must be saved as PNG files');
    }
    await page.screenshot({ path });
}

export async function terminateBrowser(browser: puppeteer.Browser): Promise<void> {
    try {
        await browser.close();
    } catch (error) {
        console.error('Error terminating browser:', error);
        throw error;
    }
}
