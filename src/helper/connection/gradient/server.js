import express from 'express';
import path from 'path';
import puppeteer from 'puppeteer';

import { color, loggers } from '../../../utils/modules/index.js';

export const server = (isReconnect) => {
	if (isReconnect) {
		return;
	}

	const app = express();
	const PORT = 4000;

	app.use(express.static(path.join(__dirname, 'public')));

	app.get('/render', (req, res) => {
		const { colors, dimensions, animate, seed, time } = req.query;

		const [width, height] = (dimensions === 'undefined' || !dimensions ? '1280x720' : dimensions).split('x').map(Number);
		const COLORS = (colors === 'undefined' || !colors ? ['#295C96', '#D0CBC7', '#899FB6'] : colors)
			.split(',')
			.map((c) => '#' + c);

		const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Mesh Gradient</title>
  <script src="http://localhost:${PORT}/build/CCapture.all.min.js"></script>
  <style>
    body, html { margin: 0; padding: 0; overflow: hidden; background: black; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="canvas" width="${width}" height="${height}"></canvas>
  <script type="module">
    import MeshGradient from "https://esm.sh/mesh-gradient.js";

    function mulberry32(seed) {
      return function() {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    const seedValue = ${seed === 'undefined' ? 'null' : seed};
    const rng = seedValue ? mulberry32(seedValue) : Math.random;
    if (seedValue) Math.random = rng;

    const gradient = new MeshGradient();
    gradient.initGradient('#canvas', ${JSON.stringify(COLORS)});
    gradient.setCanvasSize(${width}, ${height});

    const animate = ${animate === 'true' ? 'true' : 'false'};
    const fps = 30;
    const runningTime = ${time === 'undefined' || !time ? 2 : time} * fps
    const capturer = new CCapture({ format: 'webm', quality: 100, framerate: fps });
    const frames = runningTime;

    let t = seedValue ? 0 : Math.random() * 1000;
    const speed = 0.05;
    let frameCount = 0;
    const interval = 1000 / fps;

    if (animate) capturer.start();

    function renderFrame() {
      gradient.changePosition(t);
      if (animate) capturer.capture(document.querySelector('canvas'));
      t += speed;
      frameCount++;

      if (frameCount < frames) {
        setTimeout(renderFrame, interval);
      } else if (animate) {
        capturer.stop();
        capturer.save(blob => {
          window.finalBlob = blob;
          window.ready = true;
        });
      } else {
        window.ready = true;
      }
    }

    renderFrame();
  </script>
</body>
</html>
`;

		res.send(html);
	});

	app.get('/gradient', async (req, res) => {
		const { colors, dimensions, animate, seed, time } = req.query;

		const [width, height] = dimensions.split('x').map(Number);

		const browser = await puppeteer.launch({ headless: 'shell' });
		const page = await browser.newPage();

		await page.setViewport({ width, height });
		await page.goto(
			`http://localhost:${PORT}/render?colors=${colors}&dimensions=${dimensions}&animate=${animate}&seed=${seed}&time=${time}`,
			{
				waitUntil: 'networkidle0'
			}
		);

		await page.waitForFunction('window.ready === true');

		if (animate === 'true') {
			const blobBuffer = await page.evaluate(async () => {
				const arrayBuffer = await window.finalBlob.arrayBuffer();

				return Array.from(new Uint8Array(arrayBuffer));
			});

			const buffer = Buffer.from(blobBuffer);

			res.setHeader('Content-Type', 'image/webm');
			res.end(buffer);
		} else {
			const buffer = await page.screenshot({ omitBackground: false });

			res.setHeader('Content-Type', 'image/png');
			res.setHeader('Content-Disposition', 'inline; filename="gradient.png"');
			res.end(Buffer.from(buffer));
		}

		await browser.close();
	});

	app.listen(PORT, () => {
		loggers.info(color('Server Mesh Gradient', 'white'), color('started on port', '#E4C1F9'), color(PORT, 'white'));
	});
};
