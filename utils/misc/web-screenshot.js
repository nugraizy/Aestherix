import { KnownDevices } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import puppeteerSrealth from 'puppeteer-extra-plugin-stealth';

import { fetchBUFFER } from '../../helper/index.js';

puppeteer.use(puppeteerSrealth());

export const getScreenshotAPI = async (url, type) =>
	new Promise(async (resolve, reject) => {
		try {
			switch (type) {
				case 'phone':
					type = 'dimension=400x800&device=phone';
					break;
				case 'tablet':
					type = 'dimension=800x1280&device=tablet';
					break;
				case 'desktop':
					type = 'dimension=1024x768&device=desktop';
					break;
				default:
					type = 'dimension=1024x768&device=desktop';
					break;
			}
			const response = await fetchBUFFER(
				`https://api.screenshotmachine.com/?key=${process.env.WEB_SCREENSHOT}&url=${url}&${type}`,
			);
			const buffer = Buffer.from(response);

			resolve({
				buffer,
			});
		} catch (error) {
			reject(error);
		}
	});

export const getScreenshotDriver = (url, type) =>
	new Promise(async (resolve, reject) => {
		try {
			type = Object.entries(KnownDevices)[type - 1]?.[1];

			if (!type) {
				resolve({
					error: `Type not found. Available types :
${Object.keys(KnownDevices)
	.map((v, i) => `${i + 1}. ${v}`)
	.join('\n')}`,
				});
				return;
			}

			const browser = await puppeteer.launch({ headless: true });
			const page = await browser.newPage();

			await page.emulate(type);

			await page.goto(url);

			const image = await page.screenshot();

			await browser.close();

			resolve({ buffer: image });
		} catch (error) {
			reject(error);
		}
	});
