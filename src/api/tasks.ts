import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';
import { createIsolatedBrowser, autoFillForms, safeScreenshot, terminateBrowser } from '../browser';
import { safeWriteFile, logTask } from '../fs';
import { validateCommand } from '../security';

const router = Router();
const activeTasks: Record<string, { browser: any, userId: string }> = {};

router.post('/', async (req: Request, res: Response) => {
    try {
        const { userId, url, formFields } = req.body;
        if (!userId || !url) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const taskId = uuidv4();
        validateCommand(url);

        const browser = await createIsolatedBrowser(userId);
        const page = await browser.newPage();
        
        await page.goto(url);
        if (formFields) {
            await autoFillForms(page);
        }

        const screenshotPath = `./screenshots/${taskId}.png`;
        await safeScreenshot(page, screenshotPath);
        await logTask(taskId, `Task ${taskId} completed for user ${userId}`);

        activeTasks[taskId] = { browser, userId };
        res.status(201).json({ taskId, screenshotPath });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ error: errorMessage });
    }
});

router.get('/:id', (req: Request, res: Response) => {
    const taskId = req.params.id;
    if (!activeTasks[taskId]) {
        return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ status: 'active', taskId });
});

router.delete('/:id', async (req: Request, res: Response) => {
    const taskId = req.params.id;
    const task = activeTasks[taskId];
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    try {
        await terminateBrowser(task.browser);
        delete activeTasks[taskId];
        res.json({ status: 'cancelled', taskId });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ error: errorMessage });
    }
});

export default router;