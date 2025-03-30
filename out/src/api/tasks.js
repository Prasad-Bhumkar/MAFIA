"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const browser_1 = require("../browser");
const fs_1 = require("../fs");
const security_1 = require("../security");
const router = (0, express_1.Router)();
const activeTasks = {};
router.post('/', async (req, res) => {
    try {
        const { userId, url, formFields } = req.body;
        if (!userId || !url) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const taskId = (0, uuid_1.v4)();
        (0, security_1.validateCommand)(url);
        const browser = await (0, browser_1.createIsolatedBrowser)(userId);
        const page = await browser.newPage();
        await page.goto(url);
        if (formFields) {
            await (0, browser_1.autoFillForms)(page);
        }
        const screenshotPath = `./screenshots/${taskId}.png`;
        await (0, browser_1.safeScreenshot)(page, screenshotPath);
        await (0, fs_1.logTask)(taskId, `Task ${taskId} completed for user ${userId}`);
        activeTasks[taskId] = { browser, userId };
        res.status(201).json({ taskId, screenshotPath });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ error: errorMessage });
    }
});
router.get('/:id', (req, res) => {
    const taskId = req.params.id;
    if (!activeTasks[taskId]) {
        return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ status: 'active', taskId });
});
router.delete('/:id', async (req, res) => {
    const taskId = req.params.id;
    const task = activeTasks[taskId];
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    try {
        await (0, browser_1.terminateBrowser)(task.browser);
        delete activeTasks[taskId];
        res.json({ status: 'cancelled', taskId });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json({ error: errorMessage });
    }
});
exports.default = router;
//# sourceMappingURL=tasks.js.map