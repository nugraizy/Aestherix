import { exec } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import puppeteer from 'puppeteer';

import { color, loggers } from '../modules/index.js';

export async function convertLottieToVideo(lottieJson, sender) {
	const time = Date.now();
	const frameDir = `./tmp/${sender}_${time}_lottie`;
	const outputPath = `./tmp/${sender}_${time}_lottie.mp4`;

	await fs.ensureDir(frameDir);

	const fps = lottieJson.fr || 30;
	const totalFrames = lottieJson.op - lottieJson.ip;
	const width = lottieJson.w || 512;
	const height = lottieJson.h || 512;

	let browser;

	try {
		browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
		const page = await browser.newPage();

		await page.setViewport({ width, height });

		const html = `
			<html>
			<head><script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script></head>
			<body style="margin:0;overflow:hidden;background:transparent">
			<div id="anim" style="width:${width}px;height:${height}px"></div>
			<script>
				window._anim = lottie.loadAnimation({
					container: document.getElementById('anim'),
					renderer: 'canvas',
					loop: false,
					autoplay: false,
					animationData: ${JSON.stringify(lottieJson)}
				});
			</script>
			</body></html>
		`;

		await page.setContent(html, { waitUntil: 'networkidle0' });
		await page.waitForFunction('window._anim && window._anim.isLoaded');

		for (let i = 0; i < totalFrames; i++) {
			await page.evaluate((frame) => {
				window._anim.goToAndStop(frame, true);
			}, i);

			const screenshot = await page.screenshot({ type: 'png', omitBackground: true });

			await fs.writeFile(path.join(frameDir, `frame_${String(i).padStart(4, '0')}.png`), screenshot);
		}
	} finally {
		if (browser) {
			await browser.close();
		}
	}

	const result = await new Promise((resolve, reject) => {
		exec(
			`ffmpeg -framerate ${fps} -i "${frameDir}/frame_%04d.png" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${outputPath}"`,
			async (err) => {
				await fs.remove(frameDir).catch(() => {});

				if (err) {
					await fs.unlink(outputPath).catch(() => {});
					return reject(err);
				}

				const buffer = await fs.readFile(outputPath);

				await fs.unlink(outputPath).catch(() => {});
				resolve(buffer);
			}
		);
	});

	loggers.info(`${color('Lottie converted to video', 'pink')} for ${color(sender, 'lilac')}`);

	return result;
}
