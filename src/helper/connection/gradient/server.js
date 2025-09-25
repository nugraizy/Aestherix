import express from 'express';
import path from 'path';
import puppeteer from 'puppeteer';

import { color, loggers } from '../../../utils/modules/index.js';

export const server = (isReconnect) => {
	if (isReconnect) {
		return;
	}

	const app = express();

	app.use(express.static(path.join(__dirname, 'frontend/dist')));

	app.get('/gradient', async (req, res) => {
		const { colors } = req.query;

		const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
		const page = await browser.newPage();

		const reactUrl = `http://localhost:5173/?colors=${encodeURIComponent(colors || '')}`;

		await page.goto(reactUrl, { waitUntil: 'networkidle0' });

		await page.waitForSelector('#my-canvas', { timeout: 5000 });

		const canvas = await page.$('#my-canvas');
		const buffer = await canvas.screenshot();

		await browser.close();

		res.set('Content-Type', 'image/png');
		res.send(Buffer.from(buffer));
	});

	app.listen(4000, () => {
		loggers.info(color('Server Mesh Gradient', 'white'), color('started on port', '#E4C1F9'), color('4000', 'white'));
	});
};
