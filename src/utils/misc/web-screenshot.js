import Pageres from 'pageres';
import puppeteer from 'puppeteer-extra';
import puppeteerSrealth from 'puppeteer-extra-plugin-stealth';

import { fetchBUFFER } from '../modules/index.js';

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
			const buffer = await fetchBUFFER(
				`https://api.screenshotmachine.com/?key=${process.env.WEB_SCREENSHOT}&url=${url}&${type}`
			);

			resolve({
				buffer
			});
		} catch (error) {
			reject(error);
		}
	});

export const screenshot = (url) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await new Pageres({ timeout: 10000 })
				.source('https://github.com/home', ['2560x768'], { crop: false })
				.run();

			resolve({ buffer: Buffer.from(data.at(0).buffer) });
		} catch (error) {
			reject(error);
		}
	});
